/**
 * AES-256-GCM Encryption Utilities
 *
 * Used for encrypting sensitive data like SMTP passwords.
 * Requires ENCRYPTION_KEY environment variable (32-byte hex string).
 *
 * Generate a key with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get the encryption key from environment variables
 * @returns {Buffer} The encryption key as a buffer
 * @throws {Error} If ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }

  return keyBuffer;
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - The text to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext) {
  if (!plaintext) {
    return null;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} ciphertext - The encrypted string in format: iv:authTag:ciphertext
 * @returns {string} The decrypted plaintext
 * @throws {Error} If decryption fails or format is invalid
 */
export function decrypt(ciphertext) {
  if (!ciphertext) {
    return null;
  }

  const key = getEncryptionKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string appears to be encrypted (matches our format)
 * @param {string} value - The value to check
 * @returns {boolean} True if the value appears to be encrypted
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const parts = value.split(':');
  if (parts.length !== 3) {
    return false;
  }

  const [iv, authTag, encrypted] = parts;

  // IV should be 32 hex chars (16 bytes)
  // Auth tag should be 32 hex chars (16 bytes)
  // Encrypted should be at least some hex chars
  return (
    iv.length === 32 &&
    authTag.length === 32 &&
    encrypted.length > 0 &&
    /^[0-9a-f]+$/i.test(iv) &&
    /^[0-9a-f]+$/i.test(authTag) &&
    /^[0-9a-f]+$/i.test(encrypted)
  );
}
