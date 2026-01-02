import { describe, expect, it } from "bun:test";
import { countIcons, iconsEqual, mergeIconRegistries, normalizeIcons } from "./icons";

describe("normalizeIcons", () => {
  it("should return empty object for null", () => {
    expect(normalizeIcons(null)).toEqual({});
  });

  it("should return empty object for undefined", () => {
    expect(normalizeIcons(undefined)).toEqual({});
  });

  it("should return the same object for non-null input", () => {
    const icons = { aws: { compute: "base64data" } };
    expect(normalizeIcons(icons)).toBe(icons);
  });
});

describe("iconsEqual", () => {
  it("should return true for both null", () => {
    expect(iconsEqual(null, null)).toBe(true);
  });

  it("should return true for null and empty object", () => {
    expect(iconsEqual(null, {})).toBe(true);
    expect(iconsEqual({}, null)).toBe(true);
  });

  it("should return true for identical registries", () => {
    const a = { aws: { compute: "data1", storage: "data2" } };
    const b = { aws: { compute: "data1", storage: "data2" } };
    expect(iconsEqual(a, b)).toBe(true);
  });

  it("should return false for different providers", () => {
    const a = { aws: { compute: "data1" } };
    const b = { gcp: { compute: "data1" } };
    expect(iconsEqual(a, b)).toBe(false);
  });

  it("should return false for different kinds", () => {
    const a = { aws: { compute: "data1" } };
    const b = { aws: { storage: "data1" } };
    expect(iconsEqual(a, b)).toBe(false);
  });

  it("should return false for different values", () => {
    const a = { aws: { compute: "data1" } };
    const b = { aws: { compute: "data2" } };
    expect(iconsEqual(a, b)).toBe(false);
  });

  it("should return false for different number of providers", () => {
    const a = { aws: { compute: "data1" }, gcp: { compute: "data2" } };
    const b = { aws: { compute: "data1" } };
    expect(iconsEqual(a, b)).toBe(false);
  });

  it("should return false for different number of kinds", () => {
    const a = { aws: { compute: "data1", storage: "data2" } };
    const b = { aws: { compute: "data1" } };
    expect(iconsEqual(a, b)).toBe(false);
  });
});

describe("countIcons", () => {
  it("should return 0 for null", () => {
    expect(countIcons(null)).toBe(0);
  });

  it("should return 0 for undefined", () => {
    expect(countIcons(undefined)).toBe(0);
  });

  it("should return 0 for empty registry", () => {
    expect(countIcons({})).toBe(0);
  });

  it("should count icons correctly", () => {
    const registry = {
      aws: { compute: "data1", storage: "data2" },
      gcp: { compute: "data3" },
    };
    expect(countIcons(registry)).toBe(3);
  });
});

describe("mergeIconRegistries", () => {
  it("should return empty object for no arguments", () => {
    expect(mergeIconRegistries()).toEqual({});
  });

  it("should handle null and undefined", () => {
    expect(mergeIconRegistries(null, undefined)).toEqual({});
  });

  it("should return single registry unchanged", () => {
    const registry = { aws: { compute: "data1" } };
    expect(mergeIconRegistries(registry)).toEqual(registry);
  });

  it("should merge different providers", () => {
    const a = { aws: { compute: "data1" } };
    const b = { gcp: { compute: "data2" } };
    expect(mergeIconRegistries(a, b)).toEqual({
      aws: { compute: "data1" },
      gcp: { compute: "data2" },
    });
  });

  it("should merge different kinds in same provider", () => {
    const a = { aws: { compute: "data1" } };
    const b = { aws: { storage: "data2" } };
    expect(mergeIconRegistries(a, b)).toEqual({
      aws: { compute: "data1", storage: "data2" },
    });
  });

  it("should override with later values", () => {
    const a = { aws: { compute: "data1" } };
    const b = { aws: { compute: "data2" } };
    expect(mergeIconRegistries(a, b)).toEqual({
      aws: { compute: "data2" },
    });
  });

  it("should handle mixed null and valid registries", () => {
    const a = { aws: { compute: "data1" } };
    const b = null;
    const c = { gcp: { compute: "data2" } };
    expect(mergeIconRegistries(a, b, c)).toEqual({
      aws: { compute: "data1" },
      gcp: { compute: "data2" },
    });
  });
});
