import type * as vscode from "vscode";
import { parseDocument } from "yaml";
import { getIconsData, getSupportedProviders } from "../completion/icons-data";
import type { AnalysisResult, Issue, IssueRange } from "./types";

const YAML_EXTENSIONS = [".yaml", ".yml"];
const FIGRAM_FILE_PATTERNS = ["diagram.yaml", "diagram.yml", ".figram.yaml", ".figram.yml"];
const FIGRAM_ICONS_PATTERNS = ["figram-icons.yaml", "figram-icons.yml"];

// Special kinds that render as sections (containers) without icons
// These are valid kinds supported by the plugin but don't have icon entries
const SECTION_KINDS = new Set([
  // VPC kinds
  "network.vpc",
  "virtual_networks",
  "virtual_networks_classic",
  // Subnet kinds
  "network.subnet",
  "subnet",
]);

function hasExtension(fileName: string, extensions: string[]): boolean {
  return extensions.some((ext) => fileName.endsWith(ext));
}

function matchesPattern(fileName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => fileName.includes(pattern));
}

export function isFigramDocument(document: vscode.TextDocument): boolean {
  const fileName = document.fileName;

  if (matchesPattern(fileName, FIGRAM_FILE_PATTERNS)) return true;
  if (matchesPattern(fileName, FIGRAM_ICONS_PATTERNS)) return true;

  if (hasExtension(fileName, YAML_EXTENSIONS)) {
    const text = document.getText();
    if (text.includes("docId:") && text.includes("nodes:")) return true;
  }

  return false;
}

const DEFAULT_RANGE: IssueRange = { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 };

export function analyzeDocument(document: vscode.TextDocument): AnalysisResult {
  const issues: Issue[] = [];
  const text = document.getText();

  try {
    const doc = parseDocument(text, { prettyErrors: true });

    // Check for YAML syntax errors
    for (const error of doc.errors) {
      const pos = error.pos ?? [0, 0];
      const startPos = document.positionAt(pos[0]);
      const endPos = document.positionAt(pos[1]);

      issues.push({
        severity: "error",
        message: error.message,
        range: {
          startLine: startPos.line,
          startColumn: startPos.character,
          endLine: endPos.line,
          endColumn: endPos.character,
        },
        source: "figram",
      });
    }

    // If there are syntax errors, skip semantic validation
    if (doc.errors.length > 0) {
      return { issues };
    }

    const content = doc.toJS() as Record<string, unknown>;

    // Validate required fields
    if (!content.version) {
      issues.push({
        severity: "warning",
        message: "Missing required field: version",
        range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
        source: "figram",
      });
    }

    if (!content.docId) {
      issues.push({
        severity: "warning",
        message: "Missing required field: docId",
        range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
        source: "figram",
      });
    }

    // Validate nodes array
    if (content.nodes && !Array.isArray(content.nodes)) {
      issues.push({
        severity: "error",
        message: "nodes must be an array",
        range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
        source: "figram",
      });
    }

    // Validate edges array
    if (content.edges && !Array.isArray(content.edges)) {
      issues.push({
        severity: "error",
        message: "edges must be an array",
        range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
        source: "figram",
      });
    }

    // Check for duplicate node IDs and validate provider/kind
    if (Array.isArray(content.nodes)) {
      const nodeIds = new Set<string>();
      const supportedProviders = getSupportedProviders();
      const iconsData = getIconsData();
      const lines = text.split("\n");

      for (const node of content.nodes as Array<{
        id?: string;
        provider?: string;
        kind?: string;
      }>) {
        if (node.id) {
          if (nodeIds.has(node.id)) {
            issues.push({
              severity: "error",
              message: `Duplicate node ID: ${node.id}`,
              range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
              source: "figram",
            });
          }
          nodeIds.add(node.id);
        }

        // Validate provider
        if (node.provider && !supportedProviders.includes(node.provider)) {
          const lineInfo = findFieldLine(lines, node.id, "provider", node.provider);
          issues.push({
            severity: "error",
            message: `Invalid provider '${node.provider}'. Expected: ${supportedProviders.join(", ")}`,
            range: lineInfo,
            source: "figram",
          });
        }

        // Validate kind (only if provider is valid)
        if (node.provider && node.kind && supportedProviders.includes(node.provider)) {
          const providerIcons = iconsData[node.provider];
          // Allow section kinds (VPC/Subnet) even without icon entries
          const isValidKind = providerIcons?.[node.kind] || SECTION_KINDS.has(node.kind);
          if (!isValidKind) {
            const lineInfo = findFieldLine(lines, node.id, "kind", node.kind);
            issues.push({
              severity: "warning",
              message: `Unknown kind '${node.kind}' for provider '${node.provider}'`,
              range: lineInfo,
              source: "figram",
            });
          }
        }
      }
    }
  } catch (error) {
    // Handle unexpected parsing errors
    issues.push({
      severity: "error",
      message: `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`,
      range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
      source: "figram",
    });
  }

  return { issues };
}

function findFieldLine(
  lines: string[],
  nodeId: string | undefined,
  fieldName: string,
  fieldValue: string,
): IssueRange {
  if (!nodeId) return DEFAULT_RANGE;

  // Find the node by id
  let inNode = false;
  let nodeIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is the start of our node
    const idMatch = line.match(new RegExp(`^(\\s*)-\\s+id:\\s*["']?${escapeRegExp(nodeId)}["']?`));
    if (idMatch) {
      inNode = true;
      nodeIndent = idMatch[1].length;
      continue;
    }

    if (inNode) {
      // Check if we've left the node (another item at same indent or less)
      const itemMatch = line.match(/^(\s*)-\s+\w+:/);
      if (itemMatch && itemMatch[1].length <= nodeIndent) {
        break;
      }

      // Check if this line has our field
      const fieldMatch = line.match(
        new RegExp(`^(\\s*)${fieldName}:\\s*["']?(${escapeRegExp(fieldValue)})["']?`),
      );
      if (fieldMatch) {
        const valueStart = line.indexOf(fieldValue);
        return {
          startLine: i,
          startColumn: valueStart,
          endLine: i,
          endColumn: valueStart + fieldValue.length,
        };
      }
    }
  }

  return DEFAULT_RANGE;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
