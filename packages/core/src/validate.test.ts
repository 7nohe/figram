import { describe, expect, it } from "bun:test";
import { validate } from "./validate";

describe("validate", () => {
  it("should accept valid document", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [
        {
          id: "vpc",
          provider: "aws",
          kind: "network.vpc",
          layout: { x: 0, y: 0, w: 100, h: 100 },
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("should reject document without docId", () => {
    const result = validate({
      version: 1,
      nodes: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "docId")).toBe(true);
    }
  });

  it("should reject non-array nodes", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: "nope",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "nodes")).toBe(true);
    }
  });

  it("should reject invalid node layout types", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [
        {
          id: "a",
          provider: "aws",
          kind: "x",
          layout: { x: "0", y: 0, w: "1" },
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "nodes[0].layout.x")).toBe(true);
      expect(result.errors.some((e) => e.path === "nodes[0].layout.w")).toBe(true);
    }
  });

  it("should reject non-string provider and kind", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: 123, kind: null, layout: { x: 0, y: 0 } }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "nodes[0].provider")).toBe(true);
      expect(result.errors.some((e) => e.path === "nodes[0].kind")).toBe(true);
    }
  });

  it("should reject duplicate node ids", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [
        { id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } },
        { id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("duplicate"))).toBe(true);
    }
  });

  it("should reject non-existent parent", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: "aws", kind: "x", parent: "notexist", layout: { x: 0, y: 0 } }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("does not exist"))).toBe(true);
    }
  });

  it("should reject non-existent edge from/to", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
      edges: [{ id: "e1", from: "a", to: "notexist" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("does not exist"))).toBe(true);
    }
  });

  it("should reject non-array edges", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
      edges: "nope",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.path === "edges")).toBe(true);
    }
  });

  it("should reject duplicate edge ids", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
      edges: [
        { id: "e1", from: "a", to: "a" },
        { id: "e1", from: "a", to: "a" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("duplicate edge id"))).toBe(true);
    }
  });

  it("should detect parent cycles", () => {
    const result = validate({
      version: 1,
      docId: "test",
      nodes: [
        { id: "a", provider: "aws", kind: "x", parent: "b", layout: { x: 0, y: 0 } },
        { id: "b", provider: "aws", kind: "x", parent: "a", layout: { x: 0, y: 0 } },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.message.includes("cycle"))).toBe(true);
    }
  });

  // Auto-layout validation tests
  describe("auto-layout validation", () => {
    it("should fail when top-level node has no layout", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "compute.ec2" }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.message.includes("layout is required for top-level nodes")),
        ).toBe(true);
      }
    });

    it("should fail when top-level node has layout but no x/y", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "compute.ec2", layout: {} }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.message.includes("layout.x is required for top-level nodes")),
        ).toBe(true);
        expect(
          result.errors.some((e) => e.message.includes("layout.y is required for top-level nodes")),
        ).toBe(true);
      }
    });

    it("should pass when child node has no layout (auto-layout)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "ec2", provider: "aws", kind: "compute.ec2", parent: "vpc" },
        ],
      });
      expect(result.ok).toBe(true);
    });

    it("should pass when child node has empty layout (auto-layout)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "ec2", provider: "aws", kind: "compute.ec2", parent: "vpc", layout: {} },
        ],
      });
      expect(result.ok).toBe(true);
    });

    it("should pass when child node has explicit x/y", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          {
            id: "ec2",
            provider: "aws",
            kind: "compute.ec2",
            parent: "vpc",
            layout: { x: 100, y: 100 },
          },
        ],
      });
      expect(result.ok).toBe(true);
    });

    it("should fail when only x is specified (partial coordinate)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "ec2", provider: "aws", kind: "compute.ec2", parent: "vpc", layout: { x: 100 } },
        ],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.message.includes("both specified or both omitted")),
        ).toBe(true);
      }
    });

    it("should fail when only y is specified (partial coordinate)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "ec2", provider: "aws", kind: "compute.ec2", parent: "vpc", layout: { y: 100 } },
        ],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.message.includes("both specified or both omitted")),
        ).toBe(true);
      }
    });

    it("should pass when container child has layout with w/h but no x/y", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          {
            id: "subnet",
            provider: "aws",
            kind: "network.subnet",
            parent: "vpc",
            layout: { w: 700, h: 500 },
          },
        ],
      });
      expect(result.ok).toBe(true);
    });
  });

  // Edge color validation tests
  describe("edge color validation", () => {
    it("should accept valid #RRGGBB color", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#FF5733" }],
      });
      expect(result.ok).toBe(true);
    });

    it("should accept valid #RGB shorthand color", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#F53" }],
      });
      expect(result.ok).toBe(true);
    });

    it("should accept lowercase hex color", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#ff5733" }],
      });
      expect(result.ok).toBe(true);
    });

    it("should accept edge without color (optional)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a" }],
      });
      expect(result.ok).toBe(true);
    });

    it("should reject invalid color format (no hash)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "FF5733" }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "edges[0].color")).toBe(true);
      }
    });

    it("should reject invalid color format (wrong length)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#FF57" }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "edges[0].color")).toBe(true);
      }
    });

    it("should reject invalid color format (invalid characters)", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#GGHHII" }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "edges[0].color")).toBe(true);
      }
    });

    it("should reject non-string color", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: 123 }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "edges[0].color")).toBe(true);
      }
    });

    it("should reject color name instead of HEX", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "red" }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "edges[0].color")).toBe(true);
      }
    });
  });

  // Icons validation tests
  describe("icons validation", () => {
    it("should accept valid icons", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "compute.ec2", layout: { x: 0, y: 0 } }],
        icons: {
          aws: {
            "compute.ec2": "./icons/ec2.png",
            "database.rds": "./icons/rds.png",
          },
        },
      });
      expect(result.ok).toBe(true);
    });

    it("should accept document without icons", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "compute.ec2", layout: { x: 0, y: 0 } }],
      });
      expect(result.ok).toBe(true);
    });

    it("should reject non-object icons", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [],
        icons: "invalid",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "icons")).toBe(true);
      }
    });

    it("should reject array as icons", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [],
        icons: ["invalid"],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "icons")).toBe(true);
      }
    });

    it("should reject non-object provider mapping", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [],
        icons: {
          aws: "invalid",
        },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "icons.aws")).toBe(true);
      }
    });

    it("should reject non-string icon path", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [],
        icons: {
          aws: {
            "compute.ec2": 123,
          },
        },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "icons.aws.compute.ec2")).toBe(true);
      }
    });

    it("should reject empty string icon path", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [],
        icons: {
          aws: {
            "compute.ec2": "  ",
          },
        },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.path === "icons.aws.compute.ec2")).toBe(true);
      }
    });

    it("should accept multiple providers", () => {
      const result = validate({
        version: 1,
        docId: "test",
        nodes: [],
        icons: {
          aws: { "compute.ec2": "./icons/ec2.png" },
          gcp: { "compute.gce": "./icons/gce.png" },
          azure: { "compute.vm": "./icons/vm.png" },
        },
      });
      expect(result.ok).toBe(true);
    });
  });
});
