import { describe, expect, it } from "bun:test";
import { normalize } from "./normalize";
import type { DSLDocument } from "./types";

describe("normalize", () => {
  it("should convert nodes array to record", () => {
    const dsl: DSLDocument = {
      version: 1,
      docId: "test",
      nodes: [
        { id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } },
        { id: "b", provider: "aws", kind: "y", layout: { x: 10, y: 10 } },
      ],
    };

    const ir = normalize(dsl);

    expect(ir.nodes).toHaveProperty("a");
    expect(ir.nodes).toHaveProperty("b");
    expect(ir.nodes.a.id).toBe("a");
    expect(ir.nodes.b.id).toBe("b");
  });

  it("should set default values", () => {
    const dsl: DSLDocument = {
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
    };

    const ir = normalize(dsl);

    expect(ir.title).toBe("test"); // defaults to docId
    expect(ir.nodes.a.label).toBe("a"); // defaults to id
    expect(ir.nodes.a.parent).toBeNull();
    expect(ir.nodes.a.layout.w).toBeNull();
    expect(ir.nodes.a.layout.h).toBeNull();
  });

  it("should preserve explicit values", () => {
    const dsl: DSLDocument = {
      version: 1,
      docId: "test",
      title: "My Title",
      nodes: [
        {
          id: "vpc",
          provider: "aws",
          kind: "network.vpc",
          label: "VPC",
          layout: { x: 0, y: 0, w: 100, h: 100 },
        },
      ],
    };

    const ir = normalize(dsl);

    expect(ir.title).toBe("My Title");
    expect(ir.nodes.vpc.label).toBe("VPC");
    expect(ir.nodes.vpc.layout.w).toBe(100);
    expect(ir.nodes.vpc.layout.h).toBe(100);
  });

  it("should normalize edges", () => {
    const dsl: DSLDocument = {
      version: 1,
      docId: "test",
      nodes: [
        { id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } },
        { id: "b", provider: "aws", kind: "y", layout: { x: 10, y: 10 } },
      ],
      edges: [{ id: "e1", from: "a", to: "b", label: "HTTP" }],
    };

    const ir = normalize(dsl);

    expect(ir.edges.e1).toEqual({
      id: "e1",
      from: "a",
      to: "b",
      label: "HTTP",
      color: "#666666",
    });
  });

  it("should default edge label to empty string", () => {
    const dsl: DSLDocument = {
      version: 1,
      docId: "test",
      nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
      edges: [{ id: "e1", from: "a", to: "a" }],
    };

    const ir = normalize(dsl);

    expect(ir.edges.e1.label).toBe("");
  });

  // Edge color normalization tests
  describe("edge color normalization", () => {
    it("should default edge color to #666666", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a" }],
      };

      const ir = normalize(dsl);

      expect(ir.edges.e1.color).toBe("#666666");
    });

    it("should preserve explicit #RRGGBB color", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#FF5733" }],
      };

      const ir = normalize(dsl);

      expect(ir.edges.e1.color).toBe("#FF5733");
    });

    it("should expand #RGB shorthand to #RRGGBB", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#F53" }],
      };

      const ir = normalize(dsl);

      expect(ir.edges.e1.color).toBe("#FF5533");
    });

    it("should normalize lowercase to uppercase", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [{ id: "a", provider: "aws", kind: "x", layout: { x: 0, y: 0 } }],
        edges: [{ id: "e1", from: "a", to: "a", color: "#ff5733" }],
      };

      const ir = normalize(dsl);

      expect(ir.edges.e1.color).toBe("#FF5733");
    });
  });

  // Auto-layout normalization tests
  // Resource constants: PADDING=50, ITEM_WIDTH=160, ITEM_HEIGHT=140, COLS=2
  // Subnet constants: PADDING=40, DEFAULT_WIDTH=450, DEFAULT_HEIGHT=400, GAP=40, COLS=3
  describe("auto-layout normalization", () => {
    it("should auto-position first child at grid origin", () => {
      const dsl: DSLDocument = {
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
      };
      const ir = normalize(dsl);
      expect(ir.nodes.ec2.layout.x).toBe(50); // PADDING
      expect(ir.nodes.ec2.layout.y).toBe(50); // PADDING
    });

    it("should auto-position multiple children in grid pattern", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "a", provider: "aws", kind: "compute.ec2", parent: "vpc" },
          { id: "b", provider: "aws", kind: "compute.ec2", parent: "vpc" },
          { id: "c", provider: "aws", kind: "compute.ec2", parent: "vpc" }, // New row (COLS=2)
          { id: "d", provider: "aws", kind: "compute.ec2", parent: "vpc" },
        ],
      };
      const ir = normalize(dsl);

      // First row: a, b (cols 0, 1)
      expect(ir.nodes.a.layout).toEqual({ x: 50, y: 50, w: null, h: null });
      expect(ir.nodes.b.layout).toEqual({ x: 260, y: 50, w: null, h: null }); // 50 + 160 + 50

      // Second row: c, d (cols 0, 1 at row 1)
      expect(ir.nodes.c.layout).toEqual({ x: 50, y: 240, w: null, h: null }); // y: 50 + 140 + 50
      expect(ir.nodes.d.layout).toEqual({ x: 260, y: 240, w: null, h: null });
    });

    it("should preserve explicit coordinates", () => {
      const dsl: DSLDocument = {
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
            layout: { x: 500, y: 300 },
          },
        ],
      };
      const ir = normalize(dsl);
      expect(ir.nodes.ec2.layout.x).toBe(500);
      expect(ir.nodes.ec2.layout.y).toBe(300);
    });

    it("should handle mixed explicit and auto-layout", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "a", provider: "aws", kind: "compute.ec2", parent: "vpc" }, // auto: childIndex=0
          {
            id: "b",
            provider: "aws",
            kind: "compute.ec2",
            parent: "vpc",
            layout: { x: 500, y: 500 },
          }, // explicit (no childIndex)
          { id: "c", provider: "aws", kind: "compute.ec2", parent: "vpc" }, // auto: childIndex=1
        ],
      };
      const ir = normalize(dsl);
      expect(ir.nodes.a.layout).toEqual({ x: 50, y: 50, w: null, h: null });
      expect(ir.nodes.b.layout).toEqual({ x: 500, y: 500, w: null, h: null });
      expect(ir.nodes.c.layout).toEqual({ x: 260, y: 50, w: null, h: null }); // childIndex=1 (b skipped)
    });

    it("should handle layout key omission", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 800, h: 600 },
          },
          { id: "ec2", provider: "aws", kind: "compute.ec2", parent: "vpc" }, // No layout key at all
        ],
      };
      const ir = normalize(dsl);
      expect(ir.nodes.ec2.layout.x).toBe(50);
      expect(ir.nodes.ec2.layout.y).toBe(50);
      expect(ir.nodes.ec2.layout.w).toBeNull();
      expect(ir.nodes.ec2.layout.h).toBeNull();
    });

    it("should handle empty layout object", () => {
      const dsl: DSLDocument = {
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
      };
      const ir = normalize(dsl);
      expect(ir.nodes.ec2.layout.x).toBe(50);
      expect(ir.nodes.ec2.layout.y).toBe(50);
    });

    it("should preserve w/h when auto-positioning", () => {
      const dsl: DSLDocument = {
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
      };
      const ir = normalize(dsl);
      expect(ir.nodes.subnet.layout.x).toBe(40); // auto-positioned (SUBNET_LAYOUT.PADDING)
      expect(ir.nodes.subnet.layout.y).toBe(40); // auto-positioned
      expect(ir.nodes.subnet.layout.w).toBe(700); // preserved
      expect(ir.nodes.subnet.layout.h).toBe(500); // preserved
    });

    it("should handle deep nesting with independent auto-layout", () => {
      const dsl: DSLDocument = {
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
            id: "subnet1",
            provider: "aws",
            kind: "network.subnet",
            parent: "vpc",
            layout: { w: 350, h: 500 },
          },
          {
            id: "subnet2",
            provider: "aws",
            kind: "network.subnet",
            parent: "vpc",
            layout: { w: 350, h: 500 },
          },
          { id: "ec2_a", provider: "aws", kind: "compute.ec2", parent: "subnet1" }, // subnet1 childIndex=0
          { id: "ec2_b", provider: "aws", kind: "compute.ec2", parent: "subnet1" }, // subnet1 childIndex=1
          { id: "ec2_c", provider: "aws", kind: "compute.ec2", parent: "subnet2" }, // subnet2 childIndex=0
        ],
      };
      const ir = normalize(dsl);

      // VPC children (subnet1, subnet2) - use SUBNET_LAYOUT
      expect(ir.nodes.subnet1.layout.x).toBe(40); // vpc childIndex=0: PADDING
      expect(ir.nodes.subnet2.layout.x).toBe(530); // vpc childIndex=1: PADDING + (DEFAULT_WIDTH + GAP) = 40 + 490

      // Subnet1 children (ec2_a, ec2_b) - use RESOURCE_LAYOUT
      expect(ir.nodes.ec2_a.layout.x).toBe(50); // subnet1 childIndex=0
      expect(ir.nodes.ec2_b.layout.x).toBe(260); // subnet1 childIndex=1

      // Subnet2 children (ec2_c) - independent counter
      expect(ir.nodes.ec2_c.layout.x).toBe(50); // subnet2 childIndex=0 (starts fresh)
    });

    it("should auto-size subnets with default dimensions", () => {
      const dsl: DSLDocument = {
        version: 1,
        docId: "test",
        nodes: [
          {
            id: "vpc",
            provider: "aws",
            kind: "network.vpc",
            layout: { x: 0, y: 0, w: 1400, h: 800 },
          },
          { id: "subnet1", provider: "aws", kind: "network.subnet", parent: "vpc" },
          { id: "subnet2", provider: "aws", kind: "network.subnet", parent: "vpc" },
          { id: "subnet3", provider: "aws", kind: "network.subnet", parent: "vpc" },
          { id: "subnet4", provider: "aws", kind: "network.subnet", parent: "vpc" }, // New row (COLS=3)
        ],
      };
      const ir = normalize(dsl);

      // First row: subnet1, subnet2, subnet3 (cols 0, 1, 2)
      expect(ir.nodes.subnet1.layout).toEqual({ x: 40, y: 40, w: 450, h: 400 });
      expect(ir.nodes.subnet2.layout).toEqual({ x: 530, y: 40, w: 450, h: 400 }); // 40 + (450 + 40)
      expect(ir.nodes.subnet3.layout).toEqual({ x: 1020, y: 40, w: 450, h: 400 }); // 40 + 2*(450 + 40)

      // Second row: subnet4 (col 0 at row 1)
      expect(ir.nodes.subnet4.layout).toEqual({ x: 40, y: 480, w: 450, h: 400 }); // y: 40 + (400 + 40)
    });
  });
});
