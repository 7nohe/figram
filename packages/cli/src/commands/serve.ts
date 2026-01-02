import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  countIcons,
  type IRDocument,
  type IRIconRegistry,
  iconsEqual,
  mergeIconRegistries,
  normalizeIcons,
} from "@figram/core";
import { CliError } from "../errors";
import {
  ensureFileExists,
  parseDiagramYaml,
  readDiagramFile,
  tryLoadDiagram,
  validateDiagram,
} from "../lib/diagram";
import { findIconsFile, loadIconsFile, resolveIcons } from "../lib/icons";
import { computePatchMessage } from "./serve/index";
import { FileWatcher, IconsWatcher } from "./serve/watcher";
import { WebSocketManager } from "./serve/websocket";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Current protocol version - increment when breaking changes are made */
const PROTOCOL_VERSION = 1;

function getCliVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

interface ServeOptions {
  port: number;
  host: string;
  watch: boolean;
  allowRemote: boolean;
  secret?: string;
  iconsFile?: string;
}

export interface ServeHandle {
  close: () => Promise<void>;
  port: number;
}

// Re-export for backwards compatibility
export { computePatchMessage } from "./serve/patch";

export async function serveCommand(inputFile: string, options: ServeOptions): Promise<ServeHandle> {
  ensureFileExists(inputFile);

  // State management
  let currentIR: IRDocument | null = null;
  let currentIcons: IRIconRegistry | null = null;
  let currentRev = 0;

  // Watchers
  const diagramWatcher = new FileWatcher();
  const iconsWatcher = new IconsWatcher();

  function resolveIconsFilePath(): string | null {
    return options.iconsFile ?? findIconsFile(inputFile);
  }

  async function loadIcons(): Promise<IRIconRegistry | null> {
    let inlineIcons: IRIconRegistry | null = null;
    let fileIcons: IRIconRegistry | null = null;

    try {
      const content = await readDiagramFile(inputFile);
      const parsed = parseDiagramYaml(content);
      const dsl = validateDiagram(parsed);
      if (dsl.icons && Object.keys(dsl.icons).length > 0) {
        inlineIcons = await resolveIcons(dsl.icons, inputFile);
      }
    } catch {
      // Ignore errors - diagram was already loaded
    }

    const resolvedIconsFilePath = resolveIconsFilePath();
    if (options.watch) {
      iconsWatcher.update(resolvedIconsFilePath, handleIconsChange);
    }
    if (resolvedIconsFilePath) {
      const result = await loadIconsFile(resolvedIconsFilePath);
      if (result.error) {
        console.warn(`[icons] Warning: ${result.error}`);
      } else {
        fileIcons = result.icons;
        console.log(`Loaded icons: ${resolvedIconsFilePath}`);
      }
    }

    const merged = mergeIconRegistries(fileIcons, inlineIcons);
    const iconCount = countIcons(merged);
    if (iconCount > 0) {
      console.log(`Custom icons: ${iconCount} icons loaded`);
      return merged;
    }
    return null;
  }

  async function updateIcons(): Promise<boolean> {
    const nextIcons = await loadIcons();
    if (iconsEqual(currentIcons, nextIcons)) {
      return false;
    }

    currentIcons = nextIcons;
    const payload = normalizeIcons(nextIcons);
    wsManager.broadcast({ type: "icons", icons: payload });

    const iconCount = countIcons(payload);
    if (iconCount > 0) {
      console.log(`[icons] Synced ${iconCount} custom icons`);
    } else {
      console.log("[icons] Cleared custom icons");
    }

    return true;
  }

  async function handleIconsChange(): Promise<void> {
    const path = iconsWatcher.getCurrentPath();
    if (path) {
      console.log(`[icons] File changed: ${path}`);
    }
    await updateIcons();
  }

  async function handleFileChange(): Promise<void> {
    console.log(`File changed: ${inputFile}`);
    const { ir, error } = await tryLoadDiagram(inputFile);

    if (error) {
      console.error(`Parse error: ${error}`);
      wsManager.broadcast({ type: "error", message: error });
      return;
    }

    if (!ir) return;

    const patch = computePatchMessage(currentIR, currentRev, ir);
    currentIR = ir;
    const iconsUpdated = await updateIcons();
    if (!patch) {
      if (!iconsUpdated) {
        console.log(`[rev ${currentRev}] No changes`);
      }
      return;
    }

    currentRev = patch.nextRev;
    console.log(`[rev ${currentRev}] ${patch.ops.length} changes`);
    wsManager.broadcast(patch);
  }

  // Initial load
  const { ir, error } = await tryLoadDiagram(inputFile);
  if (error) {
    throw new Error(error);
  }
  currentIR = ir;
  console.log(`Loaded: ${inputFile} (docId: ${ir?.docId})`);

  currentIcons = await loadIcons();

  // Start HTTP server and WebSocket server
  const bindHost = options.allowRemote ? "0.0.0.0" : options.host;
  const httpServer = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("figram WebSocket server");
  });

  const wsManager = new WebSocketManager(
    httpServer,
    {
      secret: options.secret,
      getCliVersion,
      protocolVersion: PROTOCOL_VERSION,
    },
    {
      getCurrentIR: () => currentIR,
      getCurrentIcons: () => currentIcons,
      getCurrentRev: () => currentRev,
    },
  );

  let actualPort = options.port;
  const wssErrorPromise = new Promise<never>((_, reject) => {
    wsManager.onError(reject);
  });

  try {
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(options.port, bindHost, () => {
          const address = httpServer.address();
          if (address && typeof address === "object") {
            actualPort = (address as AddressInfo).port;
          }
          resolve();
        });
      }),
      wssErrorPromise,
    ]);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    const code = e?.code;

    if (code === "EADDRINUSE") {
      throw new CliError(
        `Port ${options.port} is already in use (try --port ${options.port + 1})`,
        1,
      );
    }

    if (code === "EACCES" || code === "EPERM") {
      throw new CliError(
        `Permission denied listening on ${bindHost}:${options.port} (try a different --port)`,
        1,
      );
    }

    throw e;
  }

  const connectHost = bindHost === "0.0.0.0" ? "127.0.0.1" : bindHost;
  console.log(`WebSocket server listening on ws://${connectHost}:${actualPort}`);
  if (bindHost === "0.0.0.0") {
    console.log("Tip: for LAN clients, use this machine's IP address (not 0.0.0.0).");
  }

  // File watching
  if (options.watch) {
    diagramWatcher.watch(inputFile, handleFileChange);
    iconsWatcher.update(resolveIconsFilePath(), handleIconsChange);
  }

  // Exit on Ctrl+C
  const sigintHandler = () => {
    console.log("\nShutting down...");
    wsManager.close();
    httpServer.close();
    process.exit(0);
  };
  process.on("SIGINT", sigintHandler);

  return {
    port: actualPort,
    close: async () => {
      process.off("SIGINT", sigintHandler);
      diagramWatcher.close();
      iconsWatcher.close();
      await wsManager.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}
