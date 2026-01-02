// UI (iframe) - WebSocket connection and message relay

import {
  areVersionsCompatible,
  type DSLDocument,
  type IRDocument,
  normalize,
  type ValidationError,
  validate,
} from "@figram/core";

declare const __PLUGIN_VERSION__: string;

type ConnectionStatus = "disconnected" | "connecting" | "connected";

let ws: WebSocket | null = null;
let connectionStatus: ConnectionStatus = "disconnected";
let cliVersion: string | null = null;

const PLUGIN_VERSION = typeof __PLUGIN_VERSION__ !== "undefined" ? __PLUGIN_VERSION__ : "0.0.0";
const STORAGE_DOC_ID = "figram:docId";
const STORAGE_WS_URL = "figram:wsUrl";

// DOM Elements
const statusEl = document.getElementById("status")!;
const docIdInput = document.getElementById("docId") as HTMLInputElement;
const wsUrlInput = document.getElementById("wsUrl") as HTMLInputElement;
const secretInput = document.getElementById("secret") as HTMLInputElement;
const connectBtn = document.getElementById("connectBtn") as HTMLButtonElement;
const jsonImportTextarea = document.getElementById("jsonImport") as HTMLTextAreaElement;
const importBtn = document.getElementById("importBtn") as HTMLButtonElement;
const pluginVersionEl = document.getElementById("pluginVersion")!;
const cliVersionEl = document.getElementById("cliVersion")!;
const versionMismatchEl = document.getElementById("versionMismatch")!;

function loadStoredInputs() {
  try {
    const storedDocId = localStorage.getItem(STORAGE_DOC_ID);
    const storedWsUrl = localStorage.getItem(STORAGE_WS_URL);

    if (storedDocId) {
      docIdInput.value = storedDocId;
    }
    if (storedWsUrl) {
      wsUrlInput.value = storedWsUrl;
    }
  } catch {
    // Ignore storage errors (sandboxed environments)
  }
}

function persistInputs(docId: string, wsUrl: string) {
  try {
    localStorage.setItem(STORAGE_DOC_ID, docId);
    localStorage.setItem(STORAGE_WS_URL, wsUrl);
  } catch {
    // Ignore storage errors (sandboxed environments)
  }
}

function maybeAutoConnect() {
  if (connectionStatus !== "disconnected") return;
  if (!docIdInput.value.trim() || !wsUrlInput.value.trim()) return;
  connect();
}

/**
 * Update version display
 */
function updateVersionDisplay() {
  pluginVersionEl.textContent = PLUGIN_VERSION;

  if (cliVersion) {
    cliVersionEl.textContent = cliVersion;

    // Check for version mismatch
    if (!areVersionsCompatible(PLUGIN_VERSION, cliVersion)) {
      versionMismatchEl.classList.add("visible");
    } else {
      versionMismatchEl.classList.remove("visible");
    }
  } else {
    cliVersionEl.textContent = "-";
    versionMismatchEl.classList.remove("visible");
  }
}

// Update status display
function updateStatus(newStatus: ConnectionStatus, message?: string) {
  connectionStatus = newStatus;
  statusEl.className = `status ${newStatus}`;

  const statusMessages: Record<ConnectionStatus, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
  };

  statusEl.textContent = message ?? statusMessages[newStatus];
  connectBtn.textContent = newStatus === "connected" ? "Disconnect" : "Connect";
  connectBtn.disabled = newStatus === "connecting";
}

// Connect to WebSocket server
function connect() {
  const docId = docIdInput.value.trim();
  const wsUrl = wsUrlInput.value.trim();
  const secret = secretInput.value.trim() || undefined;

  if (!docId) {
    alert("Please enter a Document ID");
    return;
  }

  if (!wsUrl) {
    alert("Please enter a WebSocket URL");
    return;
  }

  persistInputs(docId, wsUrl);
  updateStatus("connecting");

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Send hello message
      const hello = {
        type: "hello",
        docId,
        secret,
      };
      ws?.send(JSON.stringify(hello));
      updateStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Handle welcome message (version info)
        if (message.type === "welcome") {
          cliVersion = message.cliVersion ?? null;
          updateVersionDisplay();
          console.log(`Connected to CLI v${cliVersion}`);
          return;
        }

        // Relay message to main thread
        parent.postMessage({ pluginMessage: message }, "*");
      } catch {
        console.error("Failed to parse WebSocket message");
      }
    };

    ws.onerror = () => {
      updateStatus("disconnected", "Connection error");
    };

    ws.onclose = () => {
      updateStatus("disconnected");
      ws = null;
    };
  } catch (err) {
    updateStatus("disconnected", "Failed to connect");
    console.error(err);
  }
}

// Disconnect from WebSocket server
function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
  cliVersion = null;
  updateStatus("disconnected");
  updateVersionDisplay();
}

// Toggle connection
function toggleConnection() {
  if (connectionStatus === "connected") {
    disconnect();
  } else if (connectionStatus === "disconnected") {
    connect();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => (error.path ? `${error.path}: ${error.message}` : error.message))
    .join("\n");
}

function toDslFromIrLike(raw: Record<string, unknown>): DSLDocument {
  const nodesRecord = isRecord(raw.nodes) ? raw.nodes : {};
  const nodes = Object.values(nodesRecord).map((value) => {
    const node = isRecord(value) ? value : {};
    const layoutValue = isRecord(node.layout) ? node.layout : null;
    const layout = layoutValue
      ? {
          x: layoutValue.x as number | undefined,
          y: layoutValue.y as number | undefined,
          w: layoutValue.w === null ? undefined : (layoutValue.w as number | undefined),
          h: layoutValue.h === null ? undefined : (layoutValue.h as number | undefined),
        }
      : undefined;

    return {
      id: node.id as string,
      provider: node.provider as string,
      kind: node.kind as string,
      label: typeof node.label === "string" ? node.label : undefined,
      parent: typeof node.parent === "string" ? node.parent : undefined,
      layout,
    };
  });

  const edgesValue = raw.edges;
  let edges: DSLDocument["edges"];
  if (Array.isArray(edgesValue)) {
    edges = edgesValue as DSLDocument["edges"];
  } else if (isRecord(edgesValue)) {
    edges = Object.values(edgesValue).map((value) => {
      const edge = isRecord(value) ? value : {};
      return {
        id: edge.id as string,
        from: edge.from as string,
        to: edge.to as string,
        label: typeof edge.label === "string" ? edge.label : undefined,
        color: typeof edge.color === "string" ? edge.color : undefined,
      };
    });
  }

  return {
    version: raw.version as number,
    docId: raw.docId as string,
    title: typeof raw.title === "string" ? raw.title : undefined,
    nodes,
    edges,
  };
}

function parseImportedJson(jsonText: string): { ir: IRDocument } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return { error: "Invalid JSON format" };
  }

  if (!isRecord(raw)) {
    return { error: "JSON must be an object" };
  }

  const nodesValue = raw.nodes;
  let dslCandidate: unknown | null = null;
  if (Array.isArray(nodesValue)) {
    dslCandidate = raw;
  } else if (isRecord(nodesValue)) {
    dslCandidate = toDslFromIrLike(raw);
  }

  if (!dslCandidate) {
    return { error: "Invalid format: nodes must be an array (DSL) or object (IR)" };
  }

  const result = validate(dslCandidate);
  if (!result.ok) {
    return { error: formatValidationErrors(result.errors) };
  }

  return { ir: normalize(result.document) };
}

// Import JSON
function importJson() {
  const jsonText = jsonImportTextarea.value.trim();
  if (!jsonText) {
    alert("Please paste JSON content");
    return;
  }

  const parsed = parseImportedJson(jsonText);
  if ("error" in parsed) {
    alert(parsed.error);
    return;
  }

  const { ir } = parsed;

  // Send to main thread as full message
  parent.postMessage(
    {
      pluginMessage: {
        type: "full",
        rev: 0,
        ir,
      },
    },
    "*",
  );

  // Update docId input
  docIdInput.value = ir.docId;
  persistInputs(ir.docId, wsUrlInput.value.trim());
  alert("JSON imported successfully");
}

// Listen for messages from main thread
window.onmessage = (event) => {
  const msg = event.data?.pluginMessage;
  if (!msg) return;

  // Handle requestFull from main thread
  if (msg.type === "requestFull" && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
};

// Event listeners
connectBtn.addEventListener("click", toggleConnection);
importBtn.addEventListener("click", importJson);

// Initialize
updateStatus("disconnected");
updateVersionDisplay();
loadStoredInputs();
maybeAutoConnect();
