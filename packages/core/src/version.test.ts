import { describe, expect, it } from "bun:test";
import { areVersionsCompatible, parseMajorMinor } from "./version";

describe("parseMajorMinor", () => {
  it("should parse simple version", () => {
    expect(parseMajorMinor("1.2.3")).toEqual({ major: 1, minor: 2 });
  });

  it("should parse version without patch", () => {
    expect(parseMajorMinor("1.2")).toEqual({ major: 1, minor: 2 });
  });

  it("should parse version with prerelease", () => {
    expect(parseMajorMinor("0.1.0-beta")).toEqual({ major: 0, minor: 1 });
  });

  it("should parse version with build metadata", () => {
    expect(parseMajorMinor("2.5.0+build.123")).toEqual({ major: 2, minor: 5 });
  });

  it("should return null for invalid version", () => {
    expect(parseMajorMinor("invalid")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseMajorMinor("")).toBeNull();
  });

  it("should return null for version without minor", () => {
    expect(parseMajorMinor("1")).toBeNull();
  });
});

describe("areVersionsCompatible", () => {
  it("should return true for same major.minor", () => {
    expect(areVersionsCompatible("1.2.0", "1.2.5")).toBe(true);
  });

  it("should return true for exact same version", () => {
    expect(areVersionsCompatible("1.2.3", "1.2.3")).toBe(true);
  });

  it("should return false for different minor", () => {
    expect(areVersionsCompatible("1.2.0", "1.3.0")).toBe(false);
  });

  it("should return false for different major", () => {
    expect(areVersionsCompatible("1.2.0", "2.2.0")).toBe(false);
  });

  it("should return true if first version is invalid", () => {
    expect(areVersionsCompatible("invalid", "1.2.0")).toBe(true);
  });

  it("should return true if second version is invalid", () => {
    expect(areVersionsCompatible("1.2.0", "invalid")).toBe(true);
  });

  it("should return true if both versions are invalid", () => {
    expect(areVersionsCompatible("invalid", "also-invalid")).toBe(true);
  });

  it("should handle prerelease versions", () => {
    expect(areVersionsCompatible("0.1.0-alpha", "0.1.0-beta")).toBe(true);
    expect(areVersionsCompatible("0.1.0-alpha", "0.2.0-alpha")).toBe(false);
  });
});
