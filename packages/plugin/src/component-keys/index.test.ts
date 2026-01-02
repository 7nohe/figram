import { describe, expect, test } from "bun:test";
import { getComponentKey } from "./index";

describe("getComponentKey", () => {
  describe("aws provider", () => {
    test("returns component key for known kind", () => {
      const key = getComponentKey("aws", "compute.container.ecr");
      expect(key).toBe("a106bcf4b829b708102af5a9ce4fbc5e583da762");
    });

    test("returns null for unknown kind", () => {
      const key = getComponentKey("aws", "unknown.service");
      expect(key).toBeNull();
    });
  });

  describe("gcp provider", () => {
    test("returns component key for known kind", () => {
      const key = getComponentKey("gcp", "ai.hub");
      expect(key).toBe("f3d4bed10e7440c079d90dc83316931eb54f3d2d");
    });

    test("returns null for unknown kind", () => {
      const key = getComponentKey("gcp", "unknown.service");
      expect(key).toBeNull();
    });
  });

  describe("unknown provider", () => {
    test("returns null for azure (not yet supported)", () => {
      const key = getComponentKey("azure", "compute.vm");
      expect(key).toBeNull();
    });

    test("returns null for unknown provider", () => {
      const key = getComponentKey("unknown", "some.kind");
      expect(key).toBeNull();
    });
  });
});
