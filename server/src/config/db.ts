import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Database] Connected to MongoDB replica set successfully');
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }
}

