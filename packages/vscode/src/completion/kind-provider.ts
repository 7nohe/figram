import * as vscode from "vscode";
import { isFigramDocument } from "../diagnostics/analyzer";
import { getIconsData } from "./icons-data";
import { findProviderForPosition, isOnKindLine } from "./yaml-context";

const DEFAULT_PROVIDERS = ["aws", "azure", "gcp"];

export class KindCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): vscode.CompletionList | null {
    if (!isFigramDocument(document)) return null;
    if (!isOnKindLine(document, position)) return null;

    const provider = findProviderForPosition(document, position);
    const iconsData = getIconsData();
    const items: vscode.CompletionItem[] = [];
    const providers = provider ? [provider] : DEFAULT_PROVIDERS;

    for (const p of providers) {
      const providerIcons = iconsData[p];
      if (!providerIcons) continue;

      for (const [kind, entry] of Object.entries(providerIcons)) {
        const item = new vscode.CompletionItem(kind, vscode.CompletionItemKind.Value);
        item.detail = provider ? entry.label : `${entry.label} (${p})`;
        item.documentation = new vscode.MarkdownString(`**Category:** ${entry.category}`);
        item.sortText = `${entry.category.padStart(20, "0")}-${kind}`;
        item.filterText = provider
          ? `${kind} ${entry.label} ${entry.category}`
          : `${p} ${kind} ${entry.label} ${entry.category}`;
        items.push(item);
      }
    }

    return new vscode.CompletionList(items, false);
  }
}
