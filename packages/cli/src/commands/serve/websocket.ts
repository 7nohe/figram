import type { Server as HttpServer, IncomingMessage } from "node:http";
import { countIcons, type IRDocument, type IRIconRegistry } from "@figram/core";
import { type WebSocket, WebSocketServer } from "ws";
import {
  INVALID_MESSAGE_ERROR,
  type ServerMessage,
  sendError,
  sendErrorAndClose,
  sendFull,
  sendIcons,
  sendWelcome,
} from "./messages";

export interface ClientState {
  docId: string | null;
  authenticated: boolean;
}

export interface WebSocketManagerOptions {
  secret?: string;
  getCliVersion: () => string;
  protocolVersion: number;
}

export interface WebSocketManagerState {
  getCurrentIR: () => IRDocument | null;
  getCurrentIcons: () => IRIconRegistry | null;
  getCurrentRev: () => number;
}

/**
 * Type guard to check if a message is a valid client message
 */
export function isValidClientMessage(
  msg: unknown,
): msg is { type: string; docId?: string; secret?: string } {
  return (
    typeof msg === "object" && msg !== null && typeof (msg as { type?: unknown }).type === "string"
  );
}

export class WebSocketManager {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<WebSocket, ClientState>();
  private readonly options: WebSocketManagerOptions;
  private readonly state: WebSocketManagerState;

  constructor(
    httpServer: HttpServer,
    options: WebSocketManagerOptions,
    state: WebSocketManagerState,
  ) {
    this.wss = new WebSocketServer({ server: httpServer });
    this.options = options;
    this.state = state;
    this.setupConnectionHandler();
  }

  private setupConnectionHandler(): void {
    this.wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
      this.clients.set(ws, {
        docId: null,
        authenticated: !this.options.secret,
      });
      console.log("Client connected");

      ws.on("message", (data) => this.handleMessage(ws, data));
      ws.on("close", () => this.handleClose(ws));
    });
  }

  private handleMessage(ws: WebSocket, data: unknown): void {
    const clientState = this.clients.get(ws);
    if (!clientState) return;

    try {
      const raw: unknown = JSON.parse(String(data));

      if (!isValidClientMessage(raw)) {
        sendError(ws, INVALID_MESSAGE_ERROR);
        return;
      }

      const msgType = raw.type;

      if (msgType === "hello") {
        this.handleHello(ws, clientState, raw);
      } else if (msgType === "requestFull") {
        this.handleRequestFull(ws, clientState, raw);
      }
      // Unknown message types are silently ignored (protocol forward compatibility)
    } catch {
      sendError(ws, INVALID_MESSAGE_ERROR);
    }
  }

  private handleHello(
    ws: WebSocket,
    clientState: ClientState,
    raw: { type: string; docId?: string; secret?: string },
  ): void {
    if (this.options.secret && raw.secret !== this.options.secret) {
      sendErrorAndClose(ws, "Invalid secret");
      return;
    }

    clientState.authenticated = true;
    clientState.docId = raw.docId ?? null;

    sendWelcome(ws, this.options.getCliVersion(), this.options.protocolVersion);

    const currentIR = this.state.getCurrentIR();
    const currentIcons = this.state.getCurrentIcons();
    const currentRev = this.state.getCurrentRev();

    if (currentIR && currentIR.docId === raw.docId) {
      if (currentIcons && Object.keys(currentIcons).length > 0) {
        sendIcons(ws, currentIcons);
        console.log(`Sent ${countIcons(currentIcons)} custom icons to client`);
      }
      sendFull(ws, currentIR, currentRev);
      console.log(`Sent full IR to client (rev ${currentRev})`);
    } else {
      sendError(ws, `docId mismatch: expected ${raw.docId}, got ${currentIR?.docId}`);
    }
  }

  private handleRequestFull(
    ws: WebSocket,
    clientState: ClientState,
    raw: { type: string; docId?: string; secret?: string },
  ): void {
    if (this.options.secret && !clientState.authenticated) {
      sendError(ws, "Authentication required");
      return;
    }

    const currentIR = this.state.getCurrentIR();
    const currentIcons = this.state.getCurrentIcons();
    const currentRev = this.state.getCurrentRev();

    if (currentIR && currentIR.docId === raw.docId) {
      if (currentIcons && Object.keys(currentIcons).length > 0) {
        sendIcons(ws, currentIcons);
      }
      sendFull(ws, currentIR, currentRev);
    }
  }

  private handleClose(ws: WebSocket): void {
    this.clients.delete(ws);
    console.log("Client disconnected");
  }

  broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    const currentIR = this.state.getCurrentIR();
    for (const [ws, clientState] of this.clients.entries()) {
      if (clientState.authenticated && clientState.docId === currentIR?.docId) {
        try {
          ws.send(data);
        } catch {
          // Ignore send failures
        }
      }
    }
  }

  onError(callback: (error: Error) => void): void {
    this.wss.once("error", callback);
  }

  async close(): Promise<void> {
    return new Promise((resolve) => this.wss.close(() => resolve()));
  }
}
