import { describe, expect, it } from "bun:test";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validYaml, withTempDir } from "../../test-utils";
import { FileNotFoundError, ValidationError, YamlParseError } from "../errors";
import {
  ensureFileExists,
  loadIRFromYamlFile,
  parseDiagramYaml,
  readDiagramFile,
  tryLoadDiagram,
  validateDiagram,
} from "./diagram";

describe("diagram utilities", () => {
  it("throws when file does not exist", () => {
    const missingPath = join(tmpdir(), `figram-missing-${Date.now()}.yaml`);
    expect(() => ensureFileExists(missingPath)).toThrow(FileNotFoundError);
  });

  it("reads file contents", async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, "diagram.yaml");
      await writeFile(filePath, validYaml);

      const content = await readDiagramFile(filePath);
      expect(content).toBe(validYaml);
    });
  });

  it("parses YAML and validates", () => {
    const parsed = parseDiagramYaml(validYaml);
    const dsl = validateDiagram(parsed);
    expect(dsl.docId).toBe("doc");
  });

  it("wraps YAML parse errors", () => {
    expect(() => parseDiagramYaml("docId: [")).toThrow(YamlParseError);
  });

  it("wraps validation errors", () => {
    expect(() => validateDiagram({ version: 1, nodes: [] })).toThrow(ValidationError);
  });

  it("loads IR from YAML file", async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, "diagram.yaml");
      await writeFile(filePath, validYaml);

      const { ir } = await loadIRFromYamlFile(filePath);
      expect(ir.docId).toBe("doc");
      expect(ir.title).toBe("doc");
      expect(ir.nodes.a.label).toBe("a");
    });
  });

  it("returns error result for invalid YAML", async () => {
    await withTempDir(async (dir) => {
      const filePath = join(dir, "diagram.yaml");
      await writeFile(filePath, "docId: [");

      const result = await tryLoadDiagram(filePath);
      if (result.error === null) {
        throw new Error("expected error result");
      }
      expect(result.error).toContain("Failed to parse YAML");
    });
  });
});
