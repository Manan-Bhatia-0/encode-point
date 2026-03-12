// AES-256-GCM encryption with PBKDF2 key derivation
// Uses Web Crypto API — quantum-resistant symmetric encryption

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext with passphrase → returns decimal digit string
// Format: [salt 16B][iv 12B][ciphertext] → each byte as 3-digit decimal (000-255)
export async function encrypt(plaintext, passphrase) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  // Combine: salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Convert each byte to 3-digit decimal string
  let digits = '';
  for (const byte of combined) {
    digits += byte.toString().padStart(3, '0');
  }
  return digits;
}

// Decrypt from decimal digit string with passphrase → returns plaintext
export async function decrypt(digitString, passphrase) {
  // Parse 3-digit groups back to bytes
  if (digitString.length % 3 !== 0) {
    throw new Error('Invalid encrypted data length');
  }

  const byteCount = digitString.length / 3;
  const combined = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    const val = parseInt(digitString.substr(i * 3, 3));
    if (val > 255) throw new Error('Invalid byte value in encrypted data');
    combined[i] = val;
  }

  if (combined.length < SALT_LENGTH + IV_LENGTH + 1) {
    throw new Error('Encrypted data too short');
  }

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
