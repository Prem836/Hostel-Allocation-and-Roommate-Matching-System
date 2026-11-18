import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import {
  createHostelSchema,
  updateHostelSchema,
  createBlockSchema,
  createRoomSchema,
  updateRoomSchema,
  updateBedStatusSchema,
  bulkImportRoomsSchema,
} from './inventory.validation.js';

export class InventoryController {
  // Hostels
  static async createHostel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createHostelSchema.parse(req.body);
      const hostel = await InventoryService.createHostel(parsed);
      res.status(201).json({ success: true, data: hostel });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async getHostels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gender = req.query.gender as string | undefined;
      const hostels = await InventoryService.getHostels(gender);
      res.status(200).json({ success: true, data: hostels });
    } catch (err) {
      next(err);
    }
  }

  static async getHostelById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hostel = await InventoryService.getHostelById(req.params.id);
      res.status(200).json({ success: true, data: hostel });
    } catch (err) {
      next(err);
    }
  }

  static async updateHostel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateHostelSchema.parse(req.body);
      const hostel = await InventoryService.updateHostel(req.params.id, parsed);
      res.status(200).json({ success: true, data: hostel });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  // Blocks
  static async createBlock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createBlockSchema.parse(req.body);
      const block = await InventoryService.createBlock(parsed);
      res.status(201).json({ success: true, data: block });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async getBlocksByHostel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const blocks = await InventoryService.getBlocksByHostel(req.params.hostelId);
      res.status(200).json({ success: true, data: blocks });
    } catch (err) {
      next(err);
    }
  }

  // Rooms
  static async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createRoomSchema.parse(req.body);
      const result = await InventoryService.createRoom(parsed);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  static async getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hostelId, blockId, floor, roomType, isAccessible } = req.query;
      const rooms = await InventoryService.getRooms({
        hostelId: hostelId as string,
        blockId: blockId as string,
        floor: floor !== undefined ? parseInt(floor as string, 10) : undefined,
        roomType: roomType as any,
        isAccessible: isAccessible !== undefined ? isAccessible === 'true' : undefined,
      });
      res.status(200).json({ success: true, data: rooms });
    } catch (err) {
      next(err);
    }
  }

  static async getRoomDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const details = await InventoryService.getRoomDetailsWithBeds(req.params.id);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  // Beds
  static async updateBedStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateBedStatusSchema.parse(req.body);
      const bed = await InventoryService.updateBedStatus(req.params.id, parsed.status, parsed.notes);
      res.status(200).json({ success: true, data: bed });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  // Bulk Import
  static async bulkImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = bulkImportRoomsSchema.parse(req.body);
      const result = await InventoryService.bulkImportRooms(parsed);
      res.status(200).json({ success: true, message: 'Bulk room import complete', data: result });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({ success: false, errors: err.errors });
        return;
      }
      next(err);
    }
  }

  // Stats
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await InventoryService.getInventoryStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}
