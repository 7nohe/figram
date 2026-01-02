import { writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { loadIRFromYamlFile } from "../lib/diagram";

export async function buildCommand(inputFile: string, outputFile?: string): Promise<void> {
  const { ir } = await loadIRFromYamlFile(inputFile);

  // Determine output file name
  const ext = extname(inputFile);
  const output =
    outputFile ??
    (inputFile.match(/\.ya?ml$/)
      ? inputFile.replace(/\.ya?ml$/, ".json")
      : ext
        ? `${inputFile.slice(0, -ext.length)}.json`
        : `${inputFile}.json`);

  // Output as JSON
  await writeFile(output, JSON.stringify(ir, null, 2));
  console.log(`Built: ${inputFile} -> ${output}`);
}
