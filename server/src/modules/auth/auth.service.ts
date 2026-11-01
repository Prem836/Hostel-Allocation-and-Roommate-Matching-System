import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUser, UserRole } from './user.model.js';
import { ENV } from '../../config/env.js';
import { RegisterInput, LoginInput } from './auth.validation.js';
import { AuthUserPayload } from '../../middleware/auth.js';

export class AuthService {
  static async register(data: RegisterInput): Promise<{ user: Partial<IUser>; token: string }> {
    const existing = await User.findOne({
      $or: [
        { email: data.email },
        { registrationNumber: data.registrationNumber },
      ],
    });

    if (existing) {
      if (existing.email === data.email) {
        throw { status: 409, message: 'Email already registered' };
      }
      throw { status: 409, message: 'Registration number already registered' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      institutionId: ENV.INSTITUTION_ID,
      registrationNumber: data.registrationNumber,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      gender: data.gender,
      role: data.role || 'STUDENT',
      isAccessibleNeed: data.isAccessibleNeed ?? false,
      department: data.department,
      yearOfStudy: data.yearOfStudy,
      phone: data.phone,
      assignedHostelId: data.assignedHostelId ? new Types.ObjectId(data.assignedHostelId) : undefined,
    });

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static async login(data: LoginInput): Promise<{ user: Partial<IUser>; token: string }> {
    const user = await User.findOne({
      $or: [
        { email: data.emailOrReg.toLowerCase() },
        { registrationNumber: data.emailOrReg },
      ],
    });

    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  static async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).populate('assignedHostelId', 'name code gender');
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return this.sanitizeUser(user);
  }

  private static generateToken(user: IUser): string {
    const payload: AuthUserPayload = {
      userId: (user._id as Types.ObjectId).toString(),
      role: user.role,
      institutionId: user.institutionId,
      assignedHostelId: user.assignedHostelId ? user.assignedHostelId.toString() : undefined,
      gender: user.gender,
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  static sanitizeUser(user: IUser): Partial<IUser> {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete (obj as any).passwordHash;
    return obj;
  }
}
