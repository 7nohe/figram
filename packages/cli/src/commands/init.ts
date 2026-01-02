import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FileExistsError } from "../errors";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function initCommand(): Promise<void> {
  const filename = "diagram.yaml";

  if (existsSync(filename)) {
    throw new FileExistsError(filename);
  }

  // For bundled (dist/index.js): templates in same directory
  // For dev (src/commands/init.ts): templates in parent directory
  const bundledPath = join(__dirname, "templates", "diagram.yaml");
  const devPath = join(__dirname, "..", "templates", "diagram.yaml");
  const templatePath = existsSync(bundledPath) ? bundledPath : devPath;
  const template = await readFile(templatePath, "utf-8");

  await writeFile(filename, template);
  console.log(`Created ${filename}`);
}
