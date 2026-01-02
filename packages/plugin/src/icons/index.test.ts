import { describe, expect, it } from "bun:test";
import { base64ToUint8Array, getIconForKind, getIconForProviderKind } from "./index";

/**
 * Icon Registry Tests
 *
 * NOTE: The default icon registry is intentionally EMPTY to avoid licensing issues.
 * FigJam's built-in component keys are used instead (see component-keys/).
 *
 * These tests verify the icon lookup logic works correctly, even with an empty registry.
 * Users who add their own icons (see docs/installation.md) will benefit from these tests.
 */

describe("getIconForProviderKind", () => {
  it("returns null for empty registry (default state)", () => {
    // With empty registry, all lookups return null
    // This is expected - FigJam components are used instead
    const icon = getIconForProviderKind("aws", "compute.lambda");
    expect(icon).toBeNull();
  });

  it("returns null for unknown provider", () => {
    const icon = getIconForProviderKind("unknown", "compute.lambda");
    expect(icon).toBeNull();
  });

  it("returns null for unknown kind", () => {
    const icon = getIconForProviderKind("aws", "unknown.nonexistent.kind");
    expect(icon).toBeNull();
  });
});

describe("getIconForKind (legacy)", () => {
  it("delegates to AWS provider", () => {
    const legacyIcon = getIconForKind("compute.lambda");
    const newIcon = getIconForProviderKind("aws", "compute.lambda");
    expect(legacyIcon).toBe(newIcon);
  });

  it("returns null for unknown kind", () => {
    const icon = getIconForKind("unknown.kind");
    expect(icon).toBeNull();
  });
});

describe("base64ToUint8Array", () => {
  it("converts base64 to Uint8Array correctly", () => {
    // "Hello" in base64 is "SGVsbG8="
    const base64 = "SGVsbG8=";
    const result = base64ToUint8Array(base64);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(5);
    expect(result[0]).toBe(72); // 'H'
    expect(result[1]).toBe(101); // 'e'
    expect(result[2]).toBe(108); // 'l'
    expect(result[3]).toBe(108); // 'l'
    expect(result[4]).toBe(111); // 'o'
  });

  it("handles empty string", () => {
    const result = base64ToUint8Array("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it("handles base64 with padding", () => {
    // "Hi" in base64 is "SGk=" (1 padding char)
    const result = base64ToUint8Array("SGk=");
    expect(result.length).toBe(2);
    expect(result[0]).toBe(72); // 'H'
    expect(result[1]).toBe(105); // 'i'
  });

  it("handles base64 with double padding", () => {
    // "A" in base64 is "QQ==" (2 padding chars)
    const result = base64ToUint8Array("QQ==");
    expect(result.length).toBe(1);
    expect(result[0]).toBe(65); // 'A'
  });
});

describe("icon registry architecture", () => {
  it("empty registry returns null for all lookups", () => {
    // This is the expected behavior - icons are optional
    // FigJam component keys (in component-keys/) are the primary rendering method
    const awsIcons = ["compute.ec2", "compute.lambda", "database.rds", "storage.s3"];
    for (const kind of awsIcons) {
      expect(getIconForProviderKind("aws", kind)).toBeNull();
    }
  });
});
