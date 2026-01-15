import type * as vscode from "vscode";

const SUPPORTED_PROVIDERS = ["aws", "azure", "gcp"];

function isOnFieldLine(
  document: vscode.TextDocument,
  position: vscode.Position,
  fieldName: string,
): boolean {
  const line = document.lineAt(position.line).text;
  const pattern = new RegExp(`^\\s*${fieldName}:\\s*`);
  const match = line.match(pattern);
  return match !== null && position.character >= match[0].length;
}

export function isOnKindLine(document: vscode.TextDocument, position: vscode.Position): boolean {
  return isOnFieldLine(document, position, "kind");
}

export function isOnProviderLine(
  document: vscode.TextDocument,
  position: vscode.Position,
): boolean {
  return isOnFieldLine(document, position, "provider");
}

export function findProviderForPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | null {
  const nodeStart = findNodeStart(document, position.line);
  if (!nodeStart) return null;

  const { line: nodeStartLine, indent: nodeIndent } = nodeStart;

  for (let i = nodeStartLine; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;

    if (i > nodeStartLine) {
      const itemMatch = line.match(/^(\s*)-\s+\w+:/);
      if (itemMatch && itemMatch[1].length <= nodeIndent) break;
    }

    const providerMatch = line.match(/^\s*provider:\s*["']?(\w+)["']?/);
    if (providerMatch && SUPPORTED_PROVIDERS.includes(providerMatch[1])) {
      return providerMatch[1];
    }
  }

  return null;
}

function findNodeStart(
  document: vscode.TextDocument,
  fromLine: number,
): { line: number; indent: number } | null {
  for (let i = fromLine; i >= 0; i--) {
    const line = document.lineAt(i).text;
    const match = line.match(/^(\s*)-\s+id:/);
    if (match) {
      return { line: i, indent: match[1].length };
    }
  }
  return null;
}
