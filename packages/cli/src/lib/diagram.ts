/**
 * Shared diagram loading utilities
 *
 * Common YAML -> parse -> validate -> normalize pipeline used by build and serve commands.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { DSLDocument, IRDocument } from "@figram/core";
import { normalize, validate } from "@figram/core";
import { parse as parseYaml } from "yaml";
import { FileNotFoundError, ValidationError, YamlParseError } from "../errors";

/**
 * Result of loading a diagram file
 */
export interface DiagramLoadResult {
  ir: IRDocument;
}

/**
 * Check if a file exists and throw FileNotFoundError if not
 */
export function ensureFileExists(path: string): void {
  if (!existsSync(path)) {
    throw new FileNotFoundError(path);
  }
}

/**
 * Read file content as UTF-8 string
 */
export async function readDiagramFile(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

/**
 * Parse YAML content into unknown object
 * @throws YamlParseError if parsing fails
 */
export function parseDiagramYaml(content: string): unknown {
  try {
    return parseYaml(content);
  } catch (err) {
    throw new YamlParseError((err as Error).message);
  }
}

/**
 * Validate parsed YAML and return DSLDocument
 * @throws ValidationError if validation fails
 */
export function validateDiagram(parsed: unknown): DSLDocument {
  const result = validate(parsed);
  if (!result.ok) {
    throw new ValidationError(result.errors);
  }
  return result.document;
}

/**
 * Convert DSL document to IR
 */
export function toIR(dsl: DSLDocument): IRDocument {
  return normalize(dsl);
}

/**
 * Load YAML file and convert to IR in one step
 * @throws FileNotFoundError if file doesn't exist
 * @throws YamlParseError if YAML parsing fails
 * @throws ValidationError if validation fails
 */
export async function loadIRFromYamlFile(inputFile: string): Promise<DiagramLoadResult> {
  ensureFileExists(inputFile);
  const content = await readDiagramFile(inputFile);
  const parsed = parseDiagramYaml(content);
  const dsl = validateDiagram(parsed);
  const ir = toIR(dsl);
  return { ir };
}

/**
 * Try to load a diagram file, returning an error message instead of throwing
 * Useful for non-fatal reload scenarios (e.g., file watching)
 */
export async function tryLoadDiagram(
  inputFile: string,
): Promise<{ ir: IRDocument; error: null } | { ir: null; error: string }> {
  try {
    const { ir } = await loadIRFromYamlFile(inputFile);
    return { ir, error: null };
  } catch (err) {
    return { ir: null, error: (err as Error).message };
  }
}
