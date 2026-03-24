'use client';

/**
 * Metadata encryption/decryption utilities
 * Uses AES-GCM encryption with a derivable key based on the application
 * Must run in browser context only - requires Web Crypto API
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT = 'corruchart-metadata-v1'; // Fixed salt for consistent key derivation

/** Cache for the derived key */
let cachedKey: CryptoKey | null = null;

/**
 * Check if we're in a secure context
 */
function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext === true;
}

/**
 * Check if crypto API is available
 */
function isCryptoAvailable(): boolean {
  // Must check in execution time, not module load time
  try {
    const hasWindow = typeof window !== 'undefined';
    if (!hasWindow) {
      console.warn('window is undefined');
      return false;
    }
    
    // Check if we're in secure context (required for Web Crypto)
    if (!isSecureContext()) {
      console.warn('Not in secure context. Web Crypto requires HTTPS or localhost.');
      return false;
    }
    
    const hasCrypto = typeof window.crypto !== 'undefined';
    if (!hasCrypto) {
      console.warn('window.crypto is undefined');
      return false;
    }
    
    const hasSubtle = typeof window.crypto.subtle !== 'undefined';
    if (!hasSubtle) {
      console.warn('window.crypto.subtle is undefined - may not be in secure context');
      console.warn('Current URL:', window.location.href);
      console.warn('Is secure context:', window.isSecureContext);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error checking crypto availability:', e);
    return false;
  }
}

/**
 * Fallback obfuscation using base64 + XOR (not cryptographically secure, but better than plain text)
 */
function obfuscateFallback(data: string): string {
  // XOR with a fixed key to obfuscate
  const key = 0xAB; // Fixed obfuscation key
  const bytes = new TextEncoder().encode(data);
  const xored = new Uint8Array(bytes.length);
  
  for (let i = 0; i < bytes.length; i++) {
    xored[i] = bytes[i] ^ key;
  }
  
  // Encode as base64
  let btoaString = '';
  for (let i = 0; i < xored.length; i++) {
    btoaString += String.fromCharCode(xored[i]);
  }
  return 'obfs:' + btoa(btoaString);
}

/**
 * Fallback de-obfuscation
 */
function deobfuscateFallback(data: string): string {
  if (!data.startsWith('obfs:')) {
    throw new Error('Invalid obfuscated data format');
  }
  
  const key = 0xAB;
  const base64Data = data.slice(5); // Remove 'obfs:' prefix
  const binaryString = atob(base64Data);
  const xored = Uint8Array.from(binaryString, c => c.charCodeAt(0));
  
  const original = new Uint8Array(xored.length);
  for (let i = 0; i < xored.length; i++) {
    original[i] = xored[i] ^ key;
  }
  
  return new TextDecoder().decode(original);
}

/**
 * Get the crypto API with proper error handling
 */
function getCryptoAPI() {
  if (!isCryptoAvailable()) {
    const details = [];
    if (typeof window === 'undefined') {
      details.push('window is undefined');
    } else {
      if (!isSecureContext()) {
        details.push('not in secure context (need HTTPS)');
      }
      if (typeof window.crypto === 'undefined') details.push('window.crypto is undefined');
      if (typeof window.crypto?.subtle === 'undefined') details.push('window.crypto.subtle is undefined');
    }
    
    throw new Error(`Web Crypto not available: ${details.join(', ')}`);
  }
  return window.crypto;
}

/**
 * Derive a consistent encryption key from a fixed salt
 * This allows the site to decrypt metadata across sessions
 */
async function deriveKey(): Promise<CryptoKey> {
  const crypto = getCryptoAPI();

  // Return cached key if available
  if (cachedKey) {
    return cachedKey;
  }

  const encoder = new TextEncoder();
  
  // Hash the salt to get a consistent 32-byte key material
  const saltBytes = encoder.encode(SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', saltBytes);
  
  // Import the hashed material as AES key
  cachedKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ENCRYPTION_ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
  
  return cachedKey;
}

/**
 * Encrypt metadata string to Base64-encoded encrypted data
 * Falls back to obfuscation if Web Crypto API is unavailable
 */
export async function encryptMetadata(metadata: string): Promise<string> {
  try {
    // Check if Web Crypto is available
    if (!isCryptoAvailable()) {
      console.warn('Web Crypto not available, using fallback obfuscation');
      return obfuscateFallback(metadata);
    }

    const crypto = getCryptoAPI();
    const key = await deriveKey();
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(metadata);
    
    // Generate a random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      plaintext
    );
    
    // Combine IV + ciphertext and encode to Base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Convert to string for btoa (avoid spread operator for Uint8Array)
    let btoaString = '';
    for (let i = 0; i < combined.length; i++) {
      btoaString += String.fromCharCode(combined[i]);
    }
    
    return 'aes:' + btoa(btoaString);
  } catch (error) {
    console.error('Encryption failed:', error);
    console.warn('Falling back to obfuscation');
    return obfuscateFallback(metadata);
  }
}

/**
 * Decrypt Base64-encoded encrypted data back to metadata string
 * Handles both AES-GCM encrypted (aes: prefix) and fallback obfuscated (obfs: prefix) data
 */
export async function decryptMetadata(encryptedData: string): Promise<string> {
  try {
    // Handle obfuscation fallback format
    if (encryptedData.startsWith('obfs:')) {
      console.log('Decrypting with fallback obfuscation');
      return deobfuscateFallback(encryptedData);
    }

    // Handle AES-GCM encrypted format
    if (encryptedData.startsWith('aes:')) {
      if (!isCryptoAvailable()) {
        throw new Error('Web Crypto API required to decrypt AES-encrypted data, but it is unavailable');
      }

      const crypto = getCryptoAPI();
      const key = await deriveKey();
      
      // Remove the 'aes:' prefix
      const base64Data = encryptedData.slice(4);
      
      // Decode from Base64
      const combined = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Extract IV and ciphertext
      const iv = combined.subarray(0, 12);
      const ciphertext = combined.subarray(12);
      
      // Decrypt
      const plaintext = await crypto.subtle.decrypt(
        { name: ENCRYPTION_ALGORITHM, iv },
        key,
        ciphertext
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(plaintext);
    }

    // Handle legacy unencrypted format (for backwards compatibility)
    console.warn('Data has no encryption prefix, treating as unencrypted');
    return encryptedData;
  } catch (error) {
    console.error('Failed to decrypt metadata:', error);
    throw new Error('Failed to decrypt metadata. File may be corrupted or from a different source.');
  }
}

/**
 * Marker prefix to identify encrypted metadata in PNG chunks
 */
export const ENCRYPTED_METADATA_PREFIX = 'encrypted:';

/**
 * Check if metadata is encrypted
 */
export function isEncrypted(text: string): boolean {
  return text.startsWith(ENCRYPTED_METADATA_PREFIX);
}

/**
 * Wrap encrypted data with prefix
 */
export function wrapEncrypted(encryptedData: string): string {
  return ENCRYPTED_METADATA_PREFIX + encryptedData;
}

/**
 * Unwrap prefix from encrypted data
 */
export function unwrapEncrypted(text: string): string {
  return text.slice(ENCRYPTED_METADATA_PREFIX.length);
}
