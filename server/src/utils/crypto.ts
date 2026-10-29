import crypto from 'crypto';
import { ENV } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(ENV.DATA_ENCRYPTION_KEY, 'hex');

export interface EncryptedData {
  iv: string;
  ciphertext: string;
  tag: string;
}

export function encryptJSON<T>(data: T): EncryptedData {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  const text = JSON.stringify(data);
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    ciphertext,
    tag,
  };
}

export function decryptJSON<T>(encrypted: EncryptedData): T {
  const iv = Buffer.from(encrypted.iv, 'hex');
  const tag = Buffer.from(encrypted.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted) as T;
}

