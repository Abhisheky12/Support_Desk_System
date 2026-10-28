import crypto from 'crypto';
import Ticket from '../models/Ticket.js';

/**
 * Generate a random ticket reference like TCK-482910
 */
export const generateTicketReference = async () => {
  let unique = false;
  let reference = '';
  let attempts = 0;

  while (!unique && attempts < 10) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    reference = `TCK-${randomNum}`;
    const existing = await Ticket.findOne({ reference });
    if (!existing) {
      unique = true;
    }
    attempts++;
  }

  if (!unique) {
    reference = `TCK-${Date.now().toString().slice(-6)}`;
  }

  return reference;
};

/**
 * Generate a cryptographically secure random token for customer ticket tracking
 */
export const generateAccessToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Hash an access token with SHA-256 for secure storage
 */
export const hashAccessToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Compare plain access token against stored hash
 */
export const verifyAccessToken = (plainToken, hashedToken) => {
  if (!plainToken || !hashedToken) return false;
  const hash = hashAccessToken(plainToken);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf-8'), Buffer.from(hashedToken, 'utf-8'));
  } catch {
    return false;
  }
};

