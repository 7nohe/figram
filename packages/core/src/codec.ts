/**
 * Base64 encoding/decoding utilities
 *
 * Platform-agnostic implementations that work in Node.js,
 * browser, and Figma plugin environments.
 */

// Base64 character lookup table
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Convert base64 string to Uint8Array
 *
 * This implementation doesn't rely on atob() or Buffer,
 * making it work in Figma plugin main thread where neither is available.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  // Handle empty string
  if (!base64) return new Uint8Array(0);

  // Remove padding and calculate output length
  let padding = 0;
  if (base64.endsWith("==")) padding = 2;
  else if (base64.endsWith("=")) padding = 1;

  const length = base64.length;
  const outputLength = (length * 3) / 4 - padding;
  const bytes = new Uint8Array(outputLength);

  let byteIndex = 0;
  for (let i = 0; i < length; i += 4) {
    const c0 = base64[i];
    const c1 = base64[i + 1];
    const c2 = base64[i + 2];
    const c3 = base64[i + 3];

    const a = BASE64_CHARS.indexOf(c0);
    const b = BASE64_CHARS.indexOf(c1);
    const c = c2 === "=" ? 0 : BASE64_CHARS.indexOf(c2);
    const d = c3 === "=" ? 0 : BASE64_CHARS.indexOf(c3);

    bytes[byteIndex++] = (a << 2) | (b >> 4);
    if (c2 !== "=" && byteIndex < outputLength) {
      bytes[byteIndex++] = ((b & 15) << 4) | (c >> 2);
    }
    if (c3 !== "=" && byteIndex < outputLength) {
      bytes[byteIndex++] = ((c & 3) << 6) | d;
    }
  }

  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 *
 * This implementation doesn't rely on btoa() or Buffer,
 * making it work in any JavaScript environment.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  let result = "";
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : "=";
  }

  return result;
}
