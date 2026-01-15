import * as vscode from "vscode";
import { KindCompletionProvider, ProviderCompletionProvider } from "./completion";
import { analyzeDocument } from "./diagnostics/analyzer";
import { DiagnosticsManager } from "./diagnostics/collection";
import type { RunCliOptions } from "./ops/figramCli";
import { detectCli, runCli, showCliNotFoundNotification } from "./ops/figramCli";
import { ServerManager } from "./ops/serverManager";

const VALID_FILE_EXTENSIONS = [".yaml", ".yml"];
const YAML_SELECTOR: vscode.DocumentSelector = { language: "yaml" };

let outputChannel: vscode.OutputChannel;
let diagnosticsManager: DiagnosticsManager;
let serverManager: ServerManager;

function hasValidExtension(fileName: string): boolean {
  return VALID_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

function createCliHandlers(
  channel: vscode.OutputChannel,
): Pick<RunCliOptions, "onStdout" | "onStderr"> {
  return {
    onStdout: (data) => channel.append(data),
    onStderr: (data) => channel.append(`[stderr] ${data}`),
  };
}

async function handleCliError(error: unknown, commandName: string): Promise<void> {
  if (error instanceof Error && error.message.includes("Failed to spawn figram CLI")) {
    await showCliNotFoundNotification();
  }
  vscode.window.showErrorMessage(`Failed to run figram ${commandName}: ${error}`);
}

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("figram");
  outputChannel.appendLine("figram extension activated");

  const config = vscode.workspace.getConfiguration("figram.diagnostics");
  diagnosticsManager = new DiagnosticsManager(analyzeDocument, {
    debounceMs: config.get("debounceMs", 300),
    enabled: config.get("enabled", true),
  });

  serverManager = new ServerManager(outputChannel);

  context.subscriptions.push(
    diagnosticsManager,
    serverManager,
    vscode.languages.registerCompletionItemProvider(
      YAML_SELECTOR,
      new KindCompletionProvider(),
      ":",
    ),
    vscode.languages.registerCompletionItemProvider(
      YAML_SELECTOR,
      new ProviderCompletionProvider(),
      ":",
    ),
    registerInitCommand(),
    registerBuildCommand(),
    vscode.commands.registerCommand("figram.serve.start", () => serverManager.start()),
    vscode.commands.registerCommand("figram.serve.stop", () => serverManager.stop()),
    vscode.commands.registerCommand("figram.serve.restart", () => serverManager.restart()),
    vscode.commands.registerCommand("figram.serve.quickPick", () => serverManager.showQuickPick()),
    vscode.commands.registerCommand("figram.showOutput", () => outputChannel.show()),
    vscode.commands.registerCommand("figram.refreshDiagnostics", () =>
      diagnosticsManager.refresh(),
    ),
  );

  outputChannel.appendLine("Commands, Diagnostics, Completion, and Server Manager registered");
}

function registerInitCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("figram.init", async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const cliResult = await detectCli(workspaceFolder);

    const filename = await vscode.window.showInputBox({
      prompt: "Enter filename for the new diagram file",
      value: "diagram.yaml",
      validateInput: (value) => {
        if (!value.endsWith(".yaml") && !value.endsWith(".yml")) {
          return "Filename must end with .yaml or .yml";
        }
        return null;
      },
    });

    if (!filename) return;

    outputChannel.appendLine(`\n[figram] Running init...`);

    try {
      await runCli(cliResult, {
        args: ["init", "-o", filename],
        cwd: workspaceFolder?.uri.fsPath,
        ...createCliHandlers(outputChannel),
        onExit: async (code) => {
          if (code === 0) {
            vscode.window.showInformationMessage(`Created ${filename}`);
            const filePath = workspaceFolder
              ? vscode.Uri.joinPath(workspaceFolder.uri, filename)
              : vscode.Uri.file(filename);
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
          } else {
            vscode.window.showErrorMessage(`figram init failed with code ${code}`);
          }
        },
      });
    } catch (error) {
      await handleCliError(error, "init");
    }
  });
}

function registerBuildCommand(): vscode.Disposable {
  return vscode.commands.registerCommand("figram.build", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("Please open a file to build");
      return;
    }

    if (!hasValidExtension(editor.document.fileName)) {
      vscode.window.showErrorMessage("Please open a YAML file to build");
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const cliResult = await detectCli(workspaceFolder);
    const filePath = editor.document.uri.fsPath;
    const outputPath = filePath.replace(/\.(yaml|yml)$/, ".json");

    outputChannel.appendLine(`\n[figram] Building ${filePath}...`);

    try {
      await runCli(cliResult, {
        args: ["build", filePath, "-o", outputPath],
        cwd: workspaceFolder?.uri.fsPath,
        ...createCliHandlers(outputChannel),
        onExit: (code) => {
          if (code === 0) {
            vscode.window.showInformationMessage(`Built to ${outputPath}`);
          } else {
            vscode.window.showErrorMessage(`figram build failed with code ${code}`);
          }
        },
      });
    } catch (error) {
      await handleCliError(error, "build");
    }
  });
}

export function deactivate(): void {
  outputChannel?.dispose();
}
