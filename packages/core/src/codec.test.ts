import { describe, expect, it } from "bun:test";
import { base64ToUint8Array, uint8ArrayToBase64 } from "./codec";

describe("base64ToUint8Array", () => {
  it("should convert empty string to empty array", () => {
    expect(base64ToUint8Array("")).toEqual(new Uint8Array(0));
  });

  it("should convert simple base64 string", () => {
    // "Hello" in base64 is "SGVsbG8="
    const result = base64ToUint8Array("SGVsbG8=");
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it("should handle no padding", () => {
    // "abc" in base64 is "YWJj" (no padding)
    const result = base64ToUint8Array("YWJj");
    expect(result).toEqual(new Uint8Array([97, 98, 99]));
  });

  it("should handle single padding", () => {
    // "ab" in base64 is "YWI=" (single padding)
    const result = base64ToUint8Array("YWI=");
    expect(result).toEqual(new Uint8Array([97, 98]));
  });

  it("should handle double padding", () => {
    // "a" in base64 is "YQ==" (double padding)
    const result = base64ToUint8Array("YQ==");
    expect(result).toEqual(new Uint8Array([97]));
  });
});

describe("uint8ArrayToBase64", () => {
  it("should convert empty array to empty string", () => {
    expect(uint8ArrayToBase64(new Uint8Array(0))).toBe("");
  });

  it("should convert simple byte array", () => {
    // [72, 101, 108, 108, 111] is "Hello"
    const result = uint8ArrayToBase64(new Uint8Array([72, 101, 108, 108, 111]));
    expect(result).toBe("SGVsbG8=");
  });

  it("should handle no padding case", () => {
    // [97, 98, 99] is "abc"
    const result = uint8ArrayToBase64(new Uint8Array([97, 98, 99]));
    expect(result).toBe("YWJj");
  });

  it("should handle single padding case", () => {
    // [97, 98] is "ab"
    const result = uint8ArrayToBase64(new Uint8Array([97, 98]));
    expect(result).toBe("YWI=");
  });

  it("should handle double padding case", () => {
    // [97] is "a"
    const result = uint8ArrayToBase64(new Uint8Array([97]));
    expect(result).toBe("YQ==");
  });
});

describe("roundtrip", () => {
  it("should roundtrip correctly", () => {
    const original = new Uint8Array([0, 1, 2, 255, 254, 253, 128, 127]);
    const base64 = uint8ArrayToBase64(original);
    const decoded = base64ToUint8Array(base64);
    expect(decoded).toEqual(original);
  });

  it("should roundtrip binary data", () => {
    // Simulate image-like binary data
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      original[i] = i;
    }
    const base64 = uint8ArrayToBase64(original);
    const decoded = base64ToUint8Array(base64);
    expect(decoded).toEqual(original);
  });
});
