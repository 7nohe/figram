import * as vscode from "vscode";

export type IssueSeverity = "error" | "warning" | "info" | "hint";

export interface IssueRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface Issue {
  severity: IssueSeverity;
  message: string;
  range: IssueRange;
  code?: string;
  data?: unknown;
  source?: string;
}

export interface AnalysisResult {
  issues: Issue[];
}

const SEVERITY_MAP: Record<IssueSeverity, vscode.DiagnosticSeverity> = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
  hint: vscode.DiagnosticSeverity.Hint,
};

export function issueToVSCodeDiagnostic(issue: Issue): vscode.Diagnostic {
  const range = new vscode.Range(
    new vscode.Position(issue.range.startLine, issue.range.startColumn),
    new vscode.Position(issue.range.endLine, issue.range.endColumn),
  );

  const diagnostic = new vscode.Diagnostic(range, issue.message, SEVERITY_MAP[issue.severity]);
  diagnostic.source = issue.source ?? "figram";

  if (issue.code) {
    diagnostic.code = issue.code;
  }

  return diagnostic;
}
