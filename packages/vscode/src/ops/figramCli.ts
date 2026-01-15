import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import type { CliDetectionResult } from "./cli-runner";

export type { CliDetectionResult, RunCliOptions } from "./cli-runner";
export { runCli } from "./cli-runner";

/**
 * Detect figram CLI
 *
 * Priority:
 * 1. Workspace node_modules/.bin/figram
 * 2. PATH figram
 * 3. Config figram.cli.command
 * 4. Fallback: npx figram@latest
 */
export async function detectCli(
  workspaceFolder?: vscode.WorkspaceFolder,
): Promise<CliDetectionResult> {
  // 1. Check workspace node_modules
  if (workspaceFolder) {
    const localBin = path.join(workspaceFolder.uri.fsPath, "node_modules", ".bin", "figram");
    if (fs.existsSync(localBin)) {
      return {
        command: [localBin],
        source: "workspace",
      };
    }
  }

  // 2. Check PATH
  try {
    const { execSync } = await import("node:child_process");
    const which = process.platform === "win32" ? "where" : "which";
    execSync(`${which} figram`, { stdio: "ignore" });
    return {
      command: ["figram"],
      source: "path",
    };
  } catch {
    // Not found in PATH
  }

  // 3. Check config
  const config = vscode.workspace.getConfiguration("figram.cli");
  const configCommand = config.get<string[]>("command");
  if (configCommand && configCommand.length > 0) {
    return {
      command: configCommand,
      source: "config",
    };
  }

  // 4. Fallback to npx figram@latest
  return {
    command: ["npx", "figram@latest"],
    source: "none",
  };
}

/**
 * Show CLI not found notification with guidance
 */
export async function showCliNotFoundNotification(): Promise<void> {
  const selection = await vscode.window.showWarningMessage(
    "figram CLI not found. Install it to use figram commands.",
    "Install with npm",
    "Install with bun",
    "Configure manually",
  );

  if (selection === "Install with npm") {
    const terminal = vscode.window.createTerminal("figram");
    terminal.show();
    terminal.sendText("npm install -g figram");
  } else if (selection === "Install with bun") {
    const terminal = vscode.window.createTerminal("figram");
    terminal.show();
    terminal.sendText("bun add -g figram");
  } else if (selection === "Configure manually") {
    vscode.commands.executeCommand("workbench.action.openSettings", "figram.cli.command");
  }
}
