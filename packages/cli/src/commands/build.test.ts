import { describe, expect, it } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { validYaml, withTempDir } from "../../test-utils";
import { buildCommand } from "./build";

describe("buildCommand", () => {
  it("writes JSON output with default extension", async () => {
    await withTempDir(async (dir) => {
      const input = join(dir, "diagram.yaml");
      await writeFile(input, validYaml);

      await buildCommand(input);

      const output = join(dir, "diagram.json");
      const outputText = await readFile(output, "utf-8");
      const parsed = JSON.parse(outputText);
      expect(parsed.docId).toBe("doc");
    });
  });

  it("writes JSON output when input is not YAML", async () => {
    await withTempDir(async (dir) => {
      const input = join(dir, "diagram.txt");
      await writeFile(input, validYaml);

      await buildCommand(input);

      const output = join(dir, "diagram.json");
      const outputText = await readFile(output, "utf-8");
      const parsed = JSON.parse(outputText);
      expect(parsed.docId).toBe("doc");
    });
  });
});
