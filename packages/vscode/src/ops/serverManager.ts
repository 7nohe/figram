import type { ChildProcess } from "node:child_process";
import * as vscode from "vscode";
import { detectCli, runCli, showCliNotFoundNotification } from "./figramCli";

export type ServerState = "stopped" | "starting" | "running" | "error";

const VALID_FILE_EXTENSIONS = [".yaml", ".yml"];

export class ServerManager implements vscode.Disposable {
  private process: ChildProcess | null = null;
  private state: ServerState = "stopped";
  private statusBarItem: vscode.StatusBarItem;
  private outputChannel: vscode.OutputChannel;
  private currentFile: string | null = null;
  private currentPort: number | null = null;

  private _onStateChange = new vscode.EventEmitter<ServerState>();
  readonly onStateChange = this._onStateChange.event;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = "figram.serve.quickPick";
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  getState(): ServerState {
    return this.state;
  }

  getPort(): number | null {
    return this.currentPort;
  }

  async start(filePath?: string): Promise<void> {
    if (this.state === "running" || this.state === "starting") {
      vscode.window.showWarningMessage("figram serve is already running");
      return;
    }

    const fileUri = filePath
      ? vscode.Uri.file(filePath)
      : vscode.window.activeTextEditor?.document.uri;
    const file = fileUri?.fsPath;
    const hasValidExtension = file && VALID_FILE_EXTENSIONS.some((ext) => file.endsWith(ext));

    if (!hasValidExtension) {
      vscode.window.showErrorMessage("Please open a YAML file to serve");
      return;
    }

    const workspaceFolder = fileUri ? vscode.workspace.getWorkspaceFolder(fileUri) : undefined;
    const cliResult = await detectCli(workspaceFolder);
    const config = vscode.workspace.getConfiguration("figram.serve");
    const host = config.get<string>("host", "127.0.0.1");
    const port = config.get<number>("port", 3456);
    const allowRemote = config.get<boolean>("allowRemote", false);
    const secret = config.get<string>("secret", "");
    const noWatch = config.get<boolean>("noWatch", false);
    const iconsPath = config.get<string>("iconsPath", "");

    this.setState("starting");
    this.currentFile = file;
    this.currentPort = port;

    this.outputChannel.appendLine(`\n[figram] Starting serve...`);
    this.outputChannel.appendLine(`[figram] File: ${file}`);
    this.outputChannel.appendLine(`[figram] Host: ${host}:${port}`);

    try {
      const args = ["serve", file, "--host", host, "--port", String(port)];

      if (allowRemote) {
        args.push("--allow-remote");
        this.outputChannel.appendLine(`[figram] Remote access enabled`);
      }
      if (secret) {
        args.push("--secret", secret);
        this.outputChannel.appendLine(`[figram] Authentication enabled`);
      }
      if (noWatch) {
        args.push("--no-watch");
        this.outputChannel.appendLine(`[figram] File watching disabled`);
      }
      if (iconsPath) {
        args.push("--icons", iconsPath);
        this.outputChannel.appendLine(`[figram] Icons: ${iconsPath}`);
      }

      this.process = await runCli(cliResult, {
        args,
        cwd: workspaceFolder?.uri.fsPath,
        onStdout: (data) => {
          this.outputChannel.append(data);
          if (data.includes("WebSocket server") || data.includes("listening")) {
            this.setState("running");
          }
        },
        onStderr: (data) => {
          this.outputChannel.append(`[stderr] ${data}`);
          if (data.includes("EADDRINUSE") || data.includes("address already in use")) {
            this.setState("error");
            vscode.window
              .showErrorMessage(
                `Port ${port} is already in use. Change the port in settings or stop the other process.`,
                "Open Settings",
              )
              .then((selection) => {
                if (selection === "Open Settings") {
                  vscode.commands.executeCommand(
                    "workbench.action.openSettings",
                    "figram.serve.port",
                  );
                }
              });
          }
        },
        onExit: (code) => {
          this.outputChannel.appendLine(`\n[figram] Process exited with code ${code}`);
          this.process = null;
          if (this.state === "stopped") return;
          this.setState(code === 0 ? "stopped" : "error");
        },
      });

      setTimeout(() => {
        if (this.state === "starting") {
          this.setState("running");
        }
      }, 1000);
    } catch (error) {
      this.outputChannel.appendLine(`[figram] Error: ${error}`);
      this.setState("error");
      if (error instanceof Error && error.message.includes("Failed to spawn figram CLI")) {
        await showCliNotFoundNotification();
      }
      vscode.window.showErrorMessage(`Failed to start figram serve: ${error}`);
    }
  }

  stop(): void {
    if (!this.process) {
      this.setState("stopped");
      return;
    }

    this.outputChannel.appendLine("\n[figram] Stopping serve...");
    this.process.kill("SIGTERM");

    setTimeout(() => {
      if (this.process) {
        this.process.kill("SIGKILL");
        this.process = null;
      }
    }, 3000);

    this.setState("stopped");
    this.currentFile = null;
    this.currentPort = null;
  }

  async restart(): Promise<void> {
    const file = this.currentFile;
    this.stop();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.start(file ?? undefined);
  }

  async showQuickPick(): Promise<void> {
    const items: vscode.QuickPickItem[] = [];

    if (this.state === "running") {
      items.push(
        {
          label: "$(debug-stop) Stop Serve",
          description: "Stop the running server",
        },
        {
          label: "$(debug-restart) Restart Serve",
          description: "Restart the server",
        },
      );
    } else {
      items.push({
        label: "$(debug-start) Start Serve",
        description: "Start serving the current file",
      });
    }

    items.push({
      label: "$(output) Show Output",
      description: "Show figram output channel",
    });

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: "figram serve actions",
    });

    if (!selection) return;

    if (selection.label.includes("Start")) {
      await this.start();
    } else if (selection.label.includes("Stop")) {
      this.stop();
    } else if (selection.label.includes("Restart")) {
      await this.restart();
    } else if (selection.label.includes("Output")) {
      this.outputChannel.show();
    }
  }

  private setState(state: ServerState): void {
    this.state = state;
    this.updateStatusBar();
    this._onStateChange.fire(state);
  }

  private updateStatusBar(): void {
    switch (this.state) {
      case "stopped":
        this.statusBarItem.text = "$(debug-disconnect) figram";
        this.statusBarItem.tooltip = "figram serve: stopped";
        this.statusBarItem.backgroundColor = undefined;
        break;
      case "starting":
        this.statusBarItem.text = "$(loading~spin) figram";
        this.statusBarItem.tooltip = "figram serve: starting...";
        this.statusBarItem.backgroundColor = undefined;
        break;
      case "running":
        this.statusBarItem.text = `$(radio-tower) figram :${this.currentPort}`;
        this.statusBarItem.tooltip = `figram serve: running on port ${this.currentPort}`;
        this.statusBarItem.backgroundColor = undefined;
        break;
      case "error":
        this.statusBarItem.text = "$(error) figram";
        this.statusBarItem.tooltip = "figram serve: error";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
        break;
    }
  }

  dispose(): void {
    this.stop();
    this.statusBarItem.dispose();
    this._onStateChange.dispose();
  }
}
