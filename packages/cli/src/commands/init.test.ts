import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { withTempDir } from "../../test-utils";
import { FileExistsError } from "../errors";
import { initCommand } from "./init";

describe("initCommand", () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  test("creates diagram.yaml from template", async () => {
    await withTempDir(async (dir) => {
      process.chdir(dir);

      await initCommand();

      const created = join(dir, "diagram.yaml");
      expect(existsSync(created)).toBe(true);

      const content = await readFile(created, "utf-8");
      expect(content).toContain("version: 1");
      expect(content).toContain("docId:");
      expect(content).toContain("nodes:");
    });
  });

  test("throws FileExistsError if diagram.yaml already exists", async () => {
    await withTempDir(async (dir) => {
      process.chdir(dir);

      // Create existing file
      await writeFile(join(dir, "diagram.yaml"), "existing content");

      await expect(initCommand()).rejects.toThrow(FileExistsError);
    });
  });
});
