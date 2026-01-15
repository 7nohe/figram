import * as vscode from "vscode";
import { isFigramDocument } from "../diagnostics/analyzer";
import { getIconsData } from "./icons-data";
import { isOnProviderLine } from "./yaml-context";

const PROVIDER_INFO: Record<string, { label: string; description: string }> = {
  aws: { label: "Amazon Web Services", description: "AWS cloud services" },
  azure: { label: "Microsoft Azure", description: "Azure cloud services" },
  gcp: { label: "Google Cloud Platform", description: "GCP cloud services" },
};

export class ProviderCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext,
  ): vscode.CompletionList | null {
    if (!isFigramDocument(document)) return null;
    if (!isOnProviderLine(document, position)) return null;

    const iconsData = getIconsData();
    const items = Object.entries(PROVIDER_INFO).map(([provider, info]) => {
      const iconCount = Object.keys(iconsData[provider] || {}).length;
      const item = new vscode.CompletionItem(provider, vscode.CompletionItemKind.EnumMember);
      item.detail = `${info.label} (${iconCount} icons)`;
      item.documentation = new vscode.MarkdownString(info.description);
      item.sortText = provider;
      return item;
    });

    return new vscode.CompletionList(items, false);
  }
}
