import { Types } from 'mongoose';
import { Hostel, Block, Room, Bed, IHostel, IBlock, IRoom, IBed, RoomType, BedStatus } from './inventory.model.js';
import {
  CreateHostelInput,
  UpdateHostelInput,
  CreateBlockInput,
  CreateRoomInput,
  UpdateRoomInput,
  BulkImportRoomsInput,
} from './inventory.validation.js';
import { ENV } from '../../config/env.js';

export class InventoryService {
  // ---- HOSTELS ----
  static async createHostel(data: CreateHostelInput): Promise<IHostel> {
    const existing = await Hostel.findOne({
      institutionId: ENV.INSTITUTION_ID,
      code: data.code,
    });
    if (existing) {
      throw { status: 409, message: `Hostel with code '${data.code}' already exists` };
    }

    return await Hostel.create({
      institutionId: ENV.INSTITUTION_ID,
      ...data,
    });
  }

  static async getHostels(gender?: string): Promise<IHostel[]> {
    const query: any = { institutionId: ENV.INSTITUTION_ID };
    if (gender) query.gender = gender;
    return await Hostel.find(query).sort({ name: 1 });
  }

  static async getHostelById(id: string): Promise<IHostel> {
    const hostel = await Hostel.findOne({ _id: id, institutionId: ENV.INSTITUTION_ID });
    if (!hostel) throw { status: 404, message: 'Hostel not found' };
    return hostel;
  }

  static async updateHostel(id: string, data: UpdateHostelInput): Promise<IHostel> {
    const hostel = await Hostel.findOneAndUpdate(
      { _id: id, institutionId: ENV.INSTITUTION_ID },
      { $set: data },
      { new: true }
    );
    if (!hostel) throw { status: 404, message: 'Hostel not found' };
    return hostel;
  }

  // ---- BLOCKS ----
  static async createBlock(data: CreateBlockInput): Promise<IBlock> {
    const hostel = await this.getHostelById(data.hostelId);

    const existing = await Block.findOne({
      institutionId: ENV.INSTITUTION_ID,
      hostelId: hostel._id,
      code: data.code,
    });
    if (existing) {
      throw { status: 409, message: `Block with code '${data.code}' already exists in this hostel` };
    }

    return await Block.create({
      institutionId: ENV.INSTITUTION_ID,
      hostelId: hostel._id,
      name: data.name,
      code: data.code,
      floorsCount: data.floorsCount,
    });
  }

  static async getBlocksByHostel(hostelId: string): Promise<IBlock[]> {
    return await Block.find({ hostelId, institutionId: ENV.INSTITUTION_ID }).sort({ name: 1 });
  }

  // ---- ROOMS & BEDS ----
  static async createRoom(data: CreateRoomInput): Promise<{ room: IRoom; beds: IBed[] }> {
    const hostel = await this.getHostelById(data.hostelId);
    const block = await Block.findOne({ _id: data.blockId, hostelId: hostel._id });
    if (!block) throw { status: 404, message: 'Block not found for the given hostel' };

    const existing = await Room.findOne({
      hostelId: hostel._id,
      roomNumber: data.roomNumber,
    });
    if (existing) {
      throw { status: 409, message: `Room '${data.roomNumber}' already exists in this hostel` };
    }

    const room = await Room.create({
      institutionId: ENV.INSTITUTION_ID,
      hostelId: hostel._id,
      blockId: block._id,
      roomNumber: data.roomNumber,
      floor: data.floor,
      roomType: data.roomType,
      capacity: data.capacity,
      isAccessible: data.isAccessible ?? false,
      hasAttachedWashroom: data.hasAttachedWashroom ?? false,
      hasAirConditioning: data.hasAirConditioning ?? false,
    });

    const beds: IBed[] = [];
    if (data.createBedsAutomatically !== false) {
      const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
      const bedsToCreate = [];
      for (let i = 0; i < data.capacity; i++) {
        bedsToCreate.push({
          institutionId: ENV.INSTITUTION_ID,
          roomId: room._id,
          hostelId: hostel._id,
          bedLabel: bedLabels[i] || `Bed-${i + 1}`,
          status: 'VACANT' as BedStatus,
        });
      }
      const createdBeds = await Bed.insertMany(bedsToCreate);
      beds.push(...createdBeds);

      // Increment hostel capacity
      await Hostel.findByIdAndUpdate(hostel._id, { $inc: { totalCapacity: data.capacity } });
    }

    return { room, beds };
  }

  static async getRooms(filter: {
    hostelId?: string;
    blockId?: string;
    floor?: number;
    roomType?: RoomType;
    isAccessible?: boolean;
  }): Promise<IRoom[]> {
    const query: any = { institutionId: ENV.INSTITUTION_ID };
    if (filter.hostelId) query.hostelId = filter.hostelId;
    if (filter.blockId) query.blockId = filter.blockId;
    if (filter.floor !== undefined) query.floor = filter.floor;
    if (filter.roomType) query.roomType = filter.roomType;
    if (filter.isAccessible !== undefined) query.isAccessible = filter.isAccessible;

    return await Room.find(query).sort({ floor: 1, roomNumber: 1 });
  }

  static async getRoomDetailsWithBeds(roomId: string): Promise<{ room: IRoom; beds: IBed[] }> {
    const room = await Room.findOne({ _id: roomId, institutionId: ENV.INSTITUTION_ID })
      .populate('hostelId', 'name code gender')
      .populate('blockId', 'name code');
    if (!room) throw { status: 404, message: 'Room not found' };

    const beds = await Bed.find({ roomId: room._id }).populate('currentStudentId', 'fullName registrationNumber email');
    return { room, beds };
  }

  static async updateBedStatus(bedId: string, status: BedStatus, notes?: string): Promise<IBed> {
    const bed = await Bed.findOneAndUpdate(
      { _id: bedId, institutionId: ENV.INSTITUTION_ID },
      { $set: { status, notes } },
      { new: true }
    );
    if (!bed) throw { status: 404, message: 'Bed not found' };
    return bed;
  }

  // ---- BULK CSV / JSON IMPORT ----
  static async bulkImportRooms(data: BulkImportRoomsInput): Promise<{ roomsCreated: number; bedsCreated: number }> {
    const hostel = await this.getHostelById(data.hostelId);
    const block = await Block.findOne({ _id: data.blockId, hostelId: hostel._id });
    if (!block) throw { status: 404, message: 'Block not found for the given hostel' };

    let totalBedsCount = 0;
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (const r of data.rooms) {
      const room = await Room.findOneAndUpdate(
        { hostelId: hostel._id, roomNumber: r.roomNumber },
        {
          $setOnInsert: {
            institutionId: ENV.INSTITUTION_ID,
            hostelId: hostel._id,
            blockId: block._id,
            roomNumber: r.roomNumber,
            floor: r.floor,
            roomType: r.roomType,
            capacity: r.capacity,
            isAccessible: r.isAccessible ?? false,
            hasAttachedWashroom: r.hasAttachedWashroom ?? false,
            hasAirConditioning: r.hasAirConditioning ?? false,
          },
        },
        { upsert: true, new: true }
      );

      // Create beds if they don't exist yet
      for (let i = 0; i < r.capacity; i++) {
        const label = bedLabels[i] || `Bed-${i + 1}`;
        const bed = await Bed.findOneAndUpdate(
          { roomId: room._id, bedLabel: label },
          {
            $setOnInsert: {
              institutionId: ENV.INSTITUTION_ID,
              roomId: room._id,
              hostelId: hostel._id,
              bedLabel: label,
              status: 'VACANT' as BedStatus,
            },
          },
          { upsert: true, new: true }
        );
        if (bed) totalBedsCount++;
      }
    }

    // Refresh hostel total capacity
    const totalBedsInHostel = await Bed.countDocuments({ hostelId: hostel._id });
    await Hostel.findByIdAndUpdate(hostel._id, { totalCapacity: totalBedsInHostel });

    return { roomsCreated: data.rooms.length, bedsCreated: totalBedsCount };
  }

  // ---- INVENTORY SUMMARY / DASHBOARD ----
  static async getInventoryStats(): Promise<any> {
    const [totalHostels, totalRooms, totalBeds, vacantBeds, occupiedBeds, maintenanceBeds] = await Promise.all([
      Hostel.countDocuments({ institutionId: ENV.INSTITUTION_ID }),
      Room.countDocuments({ institutionId: ENV.INSTITUTION_ID }),
      Bed.countDocuments({ institutionId: ENV.INSTITUTION_ID }),
      Bed.countDocuments({ institutionId: ENV.INSTITUTION_ID, status: 'VACANT' }),
      Bed.countDocuments({ institutionId: ENV.INSTITUTION_ID, status: 'OCCUPIED' }),
      Bed.countDocuments({ institutionId: ENV.INSTITUTION_ID, status: 'MAINTENANCE' }),
    ]);

    return {
      totalHostels,
      totalRooms,
      totalBeds,
      vacantBeds,
      occupiedBeds,
      maintenanceBeds,
      occupancyRatePercent: totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0,
    };
  }
}
