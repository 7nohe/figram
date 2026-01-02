import { describe, expect, it } from "bun:test";
import type { IRDocument } from "@figram/core";
import { computePatchMessage } from "./patch";

describe("computePatchMessage", () => {
  const baseIR: IRDocument = {
    docId: "doc1",
    title: "Test",
    nodes: {
      node1: {
        id: "node1",
        kind: "compute.ec2",
        label: "EC2",
        provider: "aws",
        parent: null,
        layout: { x: 0, y: 0, w: null, h: null },
      },
    },
    edges: {},
  };

  it("returns null when no changes", () => {
    const result = computePatchMessage(baseIR, 0, baseIR);
    expect(result).toBeNull();
  });

  it("returns patch message when nodes differ", () => {
    const nextIR: IRDocument = {
      ...baseIR,
      nodes: {
        node1: {
          ...baseIR.nodes.node1,
          label: "Updated EC2",
        },
      },
    };

    const result = computePatchMessage(baseIR, 5, nextIR);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("patch");
    expect(result!.baseRev).toBe(5);
    expect(result!.nextRev).toBe(6);
    expect(result!.ops.length).toBeGreaterThan(0);
  });

  it("returns patch message when node added", () => {
    const nextIR: IRDocument = {
      ...baseIR,
      nodes: {
        ...baseIR.nodes,
        node2: {
          id: "node2",
          kind: "compute.lambda",
          label: "Lambda",
          provider: "aws",
          parent: null,
          layout: { x: 100, y: 100, w: null, h: null },
        },
      },
    };

    const result = computePatchMessage(baseIR, 0, nextIR);
    expect(result).not.toBeNull();
    expect(result!.ops.some((op) => op.op === "upsertNode" && op.node.id === "node2")).toBe(true);
  });

  it("returns patch message when node removed", () => {
    const nextIR: IRDocument = {
      ...baseIR,
      nodes: {},
    };

    const result = computePatchMessage(baseIR, 0, nextIR);
    expect(result).not.toBeNull();
    expect(result!.ops.some((op) => op.op === "removeNode" && op.id === "node1")).toBe(true);
  });

  it("handles initial load (prevIR is null)", () => {
    const result = computePatchMessage(null, 0, baseIR);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("patch");
    expect(result!.ops.some((op) => op.op === "upsertNode")).toBe(true);
  });
});
