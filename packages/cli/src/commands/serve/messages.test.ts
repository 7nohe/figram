import { describe, expect, mock, test } from "bun:test";
import { sendError, sendFull, sendIcons, sendMessage, sendWelcome } from "./messages";

function createMockWebSocket() {
  const messages: string[] = [];
  return {
    send: mock((data: string, callback?: () => void) => {
      messages.push(data);
      if (callback) callback();
    }),
    close: mock(() => {}),
    messages,
  };
}

describe("messages", () => {
  describe("sendMessage", () => {
    test("sends JSON-serialized message", () => {
      const ws = createMockWebSocket();
      const message = { type: "full" as const, rev: 1, ir: {} as never };

      sendMessage(ws as never, message);

      expect(ws.messages).toHaveLength(1);
      expect(JSON.parse(ws.messages[0])).toEqual(message);
    });
  });

  describe("sendError", () => {
    test("sends error message", () => {
      const ws = createMockWebSocket();

      sendError(ws as never, "Something went wrong");

      expect(ws.messages).toHaveLength(1);
      expect(JSON.parse(ws.messages[0])).toEqual({
        type: "error",
        message: "Something went wrong",
      });
    });
  });

  describe("sendWelcome", () => {
    test("sends welcome message with version info", () => {
      const ws = createMockWebSocket();

      sendWelcome(ws as never, "1.0.0", 1);

      expect(ws.messages).toHaveLength(1);
      expect(JSON.parse(ws.messages[0])).toEqual({
        type: "welcome",
        cliVersion: "1.0.0",
        protocolVersion: 1,
      });
    });
  });

  describe("sendFull", () => {
    test("sends full IR document", () => {
      const ws = createMockWebSocket();
      const ir = {
        docId: "test",
        title: "Test",
        nodes: {},
        edges: {},
      };

      sendFull(ws as never, ir, 5);

      expect(ws.messages).toHaveLength(1);
      expect(JSON.parse(ws.messages[0])).toEqual({
        type: "full",
        rev: 5,
        ir,
      });
    });
  });

  describe("sendIcons", () => {
    test("sends icons registry", () => {
      const ws = createMockWebSocket();
      const icons = {
        aws: { "compute.ec2": "base64data" },
      };

      sendIcons(ws as never, icons);

      expect(ws.messages).toHaveLength(1);
      expect(JSON.parse(ws.messages[0])).toEqual({
        type: "icons",
        icons,
      });
    });
  });
});
