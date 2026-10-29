import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_allocation?replicaSet=rs0',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  INSTITUTION_ID: process.env.INSTITUTION_ID || 'inst_default_01',
  DEFAULT_ALLOCATION_SEED: parseInt(process.env.DEFAULT_ALLOCATION_SEED || '42', 10),
};

