/**
 * PIN Management Service for ElderVoice Kiosk
 * Handles secure cryptographic SHA-256 hashing and validation for caregiver on-device PINs.
 * Prevents hardcoded credentials and ensures no secret disclosure.
 */

const STORAGE_PIN_KEY = 'eldervoice_caregiver_pin_hash';

/**
 * Pure TypeScript SHA-256 implementation
 * Produces standard hex-encoded SHA-256 digest across all runtimes (Browser, Node.js, Web Workers)
 * without requiring asynchronous crypto APIs or external libraries.
 */
export function hashPin(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII only
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s0_2 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s1_2 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);

      const t1 = hash[7] + s1_2 + ch + k[i] + (w[i] | 0);
      const t2 = s0_2 + maj;

      hash = [(t1 + t2) | 0, hash[0], hash[1], hash[2], (hash[3] + t1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Get PIN from environment variable if provided
 */
export function getEnvPin(): string | null {
  try {
    const vitePin = typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAREGIVER_PIN;
    if (vitePin && typeof vitePin === 'string' && vitePin.trim().length === 4) {
      return vitePin.trim();
    }
    const nodePin = typeof process !== 'undefined' && process.env?.VITE_CAREGIVER_PIN;
    if (nodePin && typeof nodePin === 'string' && nodePin.trim().length === 4) {
      return nodePin.trim();
    }
  } catch {
    // Ignore environment variable access errors in sandboxed contexts
  }
  return null;
}

/**
 * Check if a PIN has been configured (either in localStorage or via environment variable)
 */
export function isPinConfigured(): boolean {
  try {
    const storedHash = localStorage.getItem(STORAGE_PIN_KEY);
    if (storedHash && storedHash.length === 64) {
      return true;
    }
  } catch {
    // localStorage unavailable
  }

  return getEnvPin() !== null;
}

/**
 * Set a new 4-digit caregiver PIN (stored as SHA-256 hash in localStorage)
 */
export function setCaregiverPin(pin: string): boolean {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return false;
  }

  const hash = hashPin(pin);
  try {
    localStorage.setItem(STORAGE_PIN_KEY, hash);
    return true;
  } catch (err) {
    console.error('Failed to store caregiver PIN hash', err);
    return false;
  }
}

/**
 * Verify an entered PIN against configured PIN
 * Strictly returns false for any invalid, empty, or unconfigured PIN.
 * No hardcoded sequences (like 1234 or 0000) are accepted.
 */
export function verifyPin(pin: string): boolean {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return false;
  }

  if (!isPinConfigured()) {
    return false;
  }

  const inputHash = hashPin(pin);

  // Check stored hash in localStorage first
  try {
    const storedHash = localStorage.getItem(STORAGE_PIN_KEY);
    if (storedHash && storedHash.length === 64) {
      return inputHash === storedHash;
    }
  } catch {
    // Continue to check env var if localStorage fails
  }

  // Check environment variable
  const envPin = getEnvPin();
  if (envPin) {
    return pin === envPin || inputHash === hashPin(envPin);
  }

  return false;
}

/**
 * Clear stored PIN (useful for testing or factory reset)
 */
export function clearStoredPin(): void {
  try {
    localStorage.removeItem(STORAGE_PIN_KEY);
  } catch {
    // ignore
  }
}
