import type {
  ErrorMessage,
  FullMessage,
  IconsMessage,
  IRDocument,
  IRIconRegistry,
  PatchMessage,
  WelcomeMessage,
} from "@figram/core";
import type { WebSocket } from "ws";

export type ServerMessage =
  | WelcomeMessage
  | FullMessage
  | PatchMessage
  | ErrorMessage
  | IconsMessage;

export const INVALID_MESSAGE_ERROR = "Invalid message format";

export function sendMessage(ws: WebSocket, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

export function sendError(ws: WebSocket, message: string): void {
  sendMessage(ws, { type: "error", message });
}

export function sendErrorAndClose(ws: WebSocket, message: string): void {
  ws.send(JSON.stringify({ type: "error", message }), () => {
    try {
      ws.close();
    } catch {
      // Ignore close errors
    }
  });
}

export function sendWelcome(ws: WebSocket, cliVersion: string, protocolVersion: number): void {
  sendMessage(ws, {
    type: "welcome",
    cliVersion,
    protocolVersion,
  });
}

export function sendFull(ws: WebSocket, ir: IRDocument, rev: number): void {
  sendMessage(ws, { type: "full", rev, ir });
}

export function sendIcons(ws: WebSocket, icons: IRIconRegistry): void {
  sendMessage(ws, { type: "icons", icons });
}
