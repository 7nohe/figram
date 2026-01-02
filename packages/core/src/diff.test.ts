import { describe, expect, it } from "bun:test";
import { diff } from "./diff";
import type { IRDocument } from "./types";

describe("diff", () => {
  const baseIR: IRDocument = {
    version: 1,
    docId: "test",
    title: "Test",
    nodes: {},
    edges: {},
  };

  it("should detect new nodes", () => {
    const prev = { ...baseIR, nodes: {} };
    const next = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
    };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ op: "upsertNode", node: next.nodes.a });
  });

  it("should detect removed nodes", () => {
    const prev = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
    };
    const next = { ...baseIR, nodes: {} };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ op: "removeNode", id: "a" });
  });

  it("should remove nodes child-first", () => {
    const prev = {
      ...baseIR,
      nodes: {
        parent: {
          id: "parent",
          provider: "aws",
          kind: "x",
          label: "Parent",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
        child: {
          id: "child",
          provider: "aws",
          kind: "x",
          label: "Child",
          parent: "parent",
          layout: { x: 10, y: 10, w: null, h: null },
        },
      },
    };
    const next = { ...baseIR, nodes: {} };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(2);
    expect(ops[0]).toEqual({ op: "removeNode", id: "child" });
    expect(ops[1]).toEqual({ op: "removeNode", id: "parent" });
  });

  it("should detect modified nodes", () => {
    const prev = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
    };
    const next = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "Updated A",
          parent: null,
          layout: { x: 10, y: 10, w: null, h: null },
        },
      },
    };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ op: "upsertNode", node: next.nodes.a });
  });

  it("should detect modified edges", () => {
    const prev: IRDocument = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
        b: {
          id: "b",
          provider: "aws",
          kind: "x",
          label: "B",
          parent: null,
          layout: { x: 10, y: 10, w: null, h: null },
        },
      },
      edges: {
        e1: { id: "e1", from: "a", to: "b", label: "HTTP", color: "#666666" },
      },
    };
    const next: IRDocument = {
      ...baseIR,
      nodes: prev.nodes,
      edges: {
        e1: { id: "e1", from: "a", to: "b", label: "HTTPS", color: "#666666" },
      },
    };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ op: "upsertEdge", edge: next.edges.e1 });
  });

  it("should detect edge color change", () => {
    const prev: IRDocument = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
      edges: {
        e1: { id: "e1", from: "a", to: "a", label: "", color: "#666666" },
      },
    };
    const next: IRDocument = {
      ...baseIR,
      nodes: prev.nodes,
      edges: {
        e1: { id: "e1", from: "a", to: "a", label: "", color: "#FF5733" },
      },
    };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ op: "upsertEdge", edge: next.edges.e1 });
  });

  it("should order operations correctly: removeEdge, removeNode, upsertNode, upsertEdge", () => {
    const prev: IRDocument = {
      ...baseIR,
      nodes: {
        old: {
          id: "old",
          provider: "aws",
          kind: "x",
          label: "Old",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
      edges: {
        oldEdge: { id: "oldEdge", from: "old", to: "old", label: "", color: "#666666" },
      },
    };

    const next: IRDocument = {
      ...baseIR,
      nodes: {
        new: {
          id: "new",
          provider: "aws",
          kind: "x",
          label: "New",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
      edges: {
        newEdge: { id: "newEdge", from: "new", to: "new", label: "", color: "#666666" },
      },
    };

    const ops = diff(prev, next);

    expect(ops).toHaveLength(4);
    expect(ops[0].op).toBe("removeEdge");
    expect(ops[1].op).toBe("removeNode");
    expect(ops[2].op).toBe("upsertNode");
    expect(ops[3].op).toBe("upsertEdge");
  });

  it("should sort upsertNode parent-first", () => {
    const prev = { ...baseIR, nodes: {} };
    const next: IRDocument = {
      ...baseIR,
      nodes: {
        child: {
          id: "child",
          provider: "aws",
          kind: "x",
          label: "Child",
          parent: "parent",
          layout: { x: 0, y: 0, w: null, h: null },
        },
        parent: {
          id: "parent",
          provider: "aws",
          kind: "x",
          label: "Parent",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
    };

    const ops = diff(prev, next);

    const upsertOps = ops.filter((op) => op.op === "upsertNode");
    expect(upsertOps).toHaveLength(2);
    expect((upsertOps[0] as { op: "upsertNode"; node: { id: string } }).node.id).toBe("parent");
    expect((upsertOps[1] as { op: "upsertNode"; node: { id: string } }).node.id).toBe("child");
  });

  it("should return empty array when no changes", () => {
    const ir: IRDocument = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
    };

    const ops = diff(ir, ir);

    expect(ops).toHaveLength(0);
  });

  it("should handle null previous document (initial state)", () => {
    const next: IRDocument = {
      ...baseIR,
      nodes: {
        a: {
          id: "a",
          provider: "aws",
          kind: "x",
          label: "A",
          parent: null,
          layout: { x: 0, y: 0, w: null, h: null },
        },
      },
    };

    const ops = diff(null, next);

    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({ op: "upsertNode", node: next.nodes.a });
  });
});
