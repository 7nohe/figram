import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import type { DSLIcons, IRIconRegistry } from "@figram/core";
import { parse } from "yaml";

/** Supported image formats (SVG is NOT supported by FigJam's image API) */
const SUPPORTED_FORMATS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

/**
 * Load an icon file and convert to base64
 */
export async function loadIconAsBase64(iconPath: string, basePath: string): Promise<string> {
  const fullPath = isAbsolute(iconPath) ? iconPath : resolve(dirname(basePath), iconPath);

  const ext = extname(fullPath).toLowerCase();

  if (ext === ".svg") {
    throw new Error(
      "Unsupported image format: .svg. FigJam only supports PNG, JPG/JPEG, GIF, or WebP.",
    );
  }

  if (!SUPPORTED_FORMATS.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Supported: ${SUPPORTED_FORMATS.join(", ")}`);
  }

  const buffer = await readFile(fullPath);
  return buffer.toString("base64");
}

/**
 * Resolve DSL icons (file paths) to IR icons (base64)
 */
export async function resolveIcons(dslIcons: DSLIcons, basePath: string): Promise<IRIconRegistry> {
  const result: IRIconRegistry = {};

  for (const [provider, mapping] of Object.entries(dslIcons)) {
    result[provider] = {};

    for (const [kind, iconPath] of Object.entries(mapping)) {
      try {
        result[provider][kind] = await loadIconAsBase64(iconPath, basePath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[icons] Failed to load ${provider}:${kind} from ${iconPath}: ${message}`);
      }
    }
  }

  return result;
}

/**
 * Find figram-icons.yaml in the same directory as the diagram file
 */
export function findIconsFile(diagramPath: string): string | null {
  const dir = dirname(diagramPath);
  const candidates = ["figram-icons.yaml", "figram-icons.yml"];

  for (const candidate of candidates) {
    const fullPath = resolve(dir, candidate);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/** Icons file schema */
interface IconsFileSchema {
  version?: number;
  icons: DSLIcons;
}

/**
 * Load and parse a standalone icons file
 */
export async function loadIconsFile(
  iconsFilePath: string,
): Promise<{ icons: IRIconRegistry | null; error: string | null }> {
  try {
    const content = await readFile(iconsFilePath, "utf-8");
    const parsed = parse(content) as IconsFileSchema;

    if (!parsed || typeof parsed !== "object") {
      return { icons: null, error: "Icons file must be a YAML object" };
    }

    if (!parsed.icons || typeof parsed.icons !== "object") {
      return { icons: null, error: "Icons file must have an 'icons' field" };
    }

    const resolved = await resolveIcons(parsed.icons, iconsFilePath);
    return { icons: resolved, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { icons: null, error: message };
  }
}
