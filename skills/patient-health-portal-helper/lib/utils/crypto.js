/**
 * Cryptographic Utilities
 *
 * Handles encryption and decryption of sensitive data (passwords).
 * Uses AES-256-GCM for authenticated encryption.
 *
 * @module health-portal/utils/crypto
 */

import crypto from 'crypto';

/**
 * Encryption key derivation settings
 */
const KEY_DERIVATION = {
  algorithm: 'sha256',
  iterations: 100000,
  keyLength: 32, // 256 bits for AES-256
  saltLength: 16,
};

/**
 * Encryption settings
 */
const ENCRYPTION = {
  algorithm: 'aes-256-gcm',
  ivLength: 16,
  authTagLength: 16,
};

/**
 * Get or derive encryption key from environment
 * Uses HEALTH_PORTAL_ENCRYPTION_KEY env var or derives from machine ID
 */
function getEncryptionKey() {
  // Prefer explicit encryption key from environment
  const envKey = process.env.HEALTH_PORTAL_ENCRYPTION_KEY;
  if (envKey) {
    return Buffer.from(envKey, 'base64');
  }

  // Fallback: derive from Railway project ID or machine ID
  const projectId = process.env.RAILWAY_PROJECT_ID || process.env.HOSTNAME || 'openclaw-default';
  return crypto.createHash(KEY_DERIVATION.algorithm).update(projectId).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param {string} plaintext - The plaintext to encrypt
 * @returns {string} - Base64-encoded encrypted data (IV + auth tag + ciphertext)
 */
function encrypt(plaintext) {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty plaintext');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(ENCRYPTION.ivLength);
  const cipher = crypto.createCipheriv(ENCRYPTION.algorithm, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'binary');
  ciphertext += cipher.final('binary');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine IV + auth tag + ciphertext
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(ciphertext, 'binary'),
  ]);

  // Return as base64 for easy storage
  return combined.toString('base64');
}

/**
 * Decrypt base64-encoded data using AES-256-GCM
 *
 * @param {string} encryptedBase64 - Base64-encoded encrypted data
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedBase64) {
  if (!encryptedBase64) {
    throw new Error('Cannot decrypt empty encrypted data');
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Extract components
  const iv = combined.slice(0, ENCRYPTION.ivLength);
  const authTag = combined.slice(
    ENCRYPTION.ivLength,
    ENCRYPTION.ivLength + ENCRYPTION.authTagLength
  );
  const ciphertext = combined.slice(
    ENCRYPTION.ivLength + ENCRYPTION.authTagLength
  );

  const decipher = crypto.createDecipheriv(ENCRYPTION.algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, 'binary', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Hash a string for comparison (one-way)
 * Uses SHA-256 for secure password hashing
 *
 * @param {string} input - The input string to hash
 * @returns {string} - Hex-encoded hash
 */
function hash(input) {
  if (!input) {
    throw new Error('Cannot hash empty input');
  }

  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Verify a plaintext against a hash
 *
 * @param {string} plaintext - The plaintext to verify
 * @param {string} hashValue - The hash to compare against
 * @returns {boolean} - True if hash matches
 */
function verifyHash(plaintext, hashValue) {
  return hash(plaintext) === hashValue;
}

/**
 * Generate a random string for tokens or salts
 *
 * @param {number} length - Length of the random string (default: 32)
 * @returns {string} - Hex-encoded random string
 */
function generateRandom(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encode credentials for environment variable storage
 * Encrypts password and returns JSON string with username and encrypted password
 *
 * @param {string} username - Portal username
 * @param {string} password - Portal password (will be encrypted)
 * @returns {string} - Base64-encoded JSON with encrypted credentials
 */
function encodeCredentials(username, password) {
  const credentials = {
    username,
    password_encrypted: encrypt(password),
    timestamp: new Date().toISOString(),
  };

  return Buffer.from(JSON.stringify(credentials)).toString('base64');
}

/**
 * Decode credentials from environment variable storage
 *
 * @param {string} encoded - Base64-encoded JSON with encrypted credentials
 * @returns {object} - Object with username and password (decrypted)
 */
function decodeCredentials(encoded) {
  if (!encoded) {
    throw new Error('Cannot decode empty credentials');
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const credentials = JSON.parse(decoded);

  return {
    username: credentials.username,
    password: decrypt(credentials.password_encrypted),
  };
}

export {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateRandom,
  encodeCredentials,
  decodeCredentials,
};
