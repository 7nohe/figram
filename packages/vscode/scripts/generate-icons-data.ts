import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

interface IconEntry {
  label: string;
  category: string;
}

type IconsData = Record<string, Record<string, IconEntry>>;

function parseIconsMarkdown(content: string): Record<string, IconEntry> {
  const icons: Record<string, IconEntry> = {};
  let currentCategory = "";

  const lines = content.split("\n");

  for (const line of lines) {
    // Category headers: ## AI
    const categoryMatch = line.match(/^##\s+(.+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Table rows: | `compute.ec2` | EC2 |
    const rowMatch = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|/);
    if (rowMatch && currentCategory) {
      const kind = rowMatch[1];
      const label = rowMatch[2].trim();
      icons[kind] = { label, category: currentCategory };
    }
  }

  return icons;
}

function main() {
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  const docsPath = join(scriptDir, "../../docs/src/content/docs/en");

  const data: IconsData = {
    aws: {},
    azure: {},
    gcp: {},
  };

  const files = [
    ["icons-aws.md", "aws"],
    ["icons-azure.md", "azure"],
    ["icons-gcp.md", "gcp"],
  ] as const;

  for (const [file, provider] of files) {
    const filePath = join(docsPath, file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf-8");
      data[provider] = parseIconsMarkdown(content);
      console.log(`Parsed ${file}: ${Object.keys(data[provider]).length} icons`);
    } else {
      console.warn(`Warning: ${filePath} not found`);
    }
  }

  const outputDir = join(scriptDir, "../src/data");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, "icons.json");
  writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);

  const total =
    Object.keys(data.aws).length + Object.keys(data.azure).length + Object.keys(data.gcp).length;

  console.log(`\nGenerated icons.json with ${total} total icons:`);
  console.log(`  AWS: ${Object.keys(data.aws).length} icons`);
  console.log(`  Azure: ${Object.keys(data.azure).length} icons`);
  console.log(`  GCP: ${Object.keys(data.gcp).length} icons`);
}

main();
