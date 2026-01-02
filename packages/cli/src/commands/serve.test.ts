import { describe, expect, it } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { IRDocument, IRNode } from "@figram/core";
import { WebSocket } from "ws";
import { validYaml, withTempDir } from "../../test-utils";
import { computePatchMessage, serveCommand } from "./serve";

function makeBaseDoc(): IRDocument {
  const node: IRNode = {
    id: "n1",
    provider: "test",
    kind: "test.kind",
    label: "Node 1",
    parent: null,
    layout: { x: 0, y: 0, w: null, h: null },
  };

  return {
    version: 1,
    docId: "doc",
    title: "Document",
    nodes: { [node.id]: node },
    edges: {},
  };
}

async function startServer(input: string): Promise<Awaited<ReturnType<typeof serveCommand>>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 30000 + Math.floor(Math.random() * 20000);
    try {
      return await serveCommand(input, {
        port,
        host: "127.0.0.1",
        watch: false,
        allowRemote: false,
        secret: "shh",
      });
    } catch (err) {
      lastError = err;
      if (isPortInUseError(err)) {
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("Unable to find an open port for serveCommand");
}

function isPortInUseError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const message = err.message;
  return (
    message.includes("already in use") ||
    message.includes("Failed to start server") ||
    message.includes("Is port")
  );
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });
}

function waitForClose(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    ws.once("close", () => resolve());
  });
}

function waitForMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    ws.once("message", (data) => {
      let text: string;
      if (typeof data === "string") {
        text = data;
      } else if (Array.isArray(data)) {
        text = Buffer.concat(data).toString();
      } else if (data instanceof ArrayBuffer) {
        text = Buffer.from(data).toString();
      } else {
        text = data.toString();
      }
      resolve(JSON.parse(text));
    });
    ws.once("error", reject);
  });
}

describe("computePatchMessage", () => {
  it("returns null when diff has no ops", () => {
    const baseDoc = makeBaseDoc();
    const sameDoc: IRDocument = {
      ...baseDoc,
      nodes: {
        n1: {
          ...baseDoc.nodes.n1,
          layout: { ...baseDoc.nodes.n1.layout },
        },
      },
      edges: {},
    };

    const patch = computePatchMessage(baseDoc, 7, sameDoc);
    expect(patch).toBeNull();
  });

  it("returns patch with nextRev=baseRev+1 when ops exist", () => {
    const baseDoc = makeBaseDoc();
    const changedDoc: IRDocument = {
      ...baseDoc,
      nodes: {
        n1: {
          ...baseDoc.nodes.n1,
          layout: { ...baseDoc.nodes.n1.layout, x: 1 },
        },
      },
      edges: {},
    };

    const patch = computePatchMessage(baseDoc, 7, changedDoc);
    expect(patch).not.toBeNull();
    if (!patch) throw new Error("expected a patch message");
    expect(patch.baseRev).toBe(7);
    expect(patch.nextRev).toBe(8);
    expect(patch.ops).toHaveLength(1);
    expect(patch.ops[0]?.op).toBe("upsertNode");
  });
});

describe("serveCommand", () => {
  it("rejects requestFull when secret is required", async () => {
    await withTempDir(async (dir) => {
      const input = join(dir, "diagram.yaml");
      await writeFile(input, validYaml);

      const server = await startServer(input);

      const ws = new WebSocket(`ws://127.0.0.1:${server.port}`);
      try {
        await waitForOpen(ws);

        const messagePromise = waitForMessage(ws);
        const closePromise = waitForClose(ws);

        ws.send(JSON.stringify({ type: "requestFull", docId: "doc" }));

        const message = await messagePromise;
        expect(message).toEqual({ type: "error", message: "Authentication required" });
        ws.close();
        await closePromise;
      } finally {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        await server.close();
      }
    });
  });
});
