import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";

// Read version from package.json at build time
function getPluginVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// Embed compiled UI JS into HTML template
function embedUiScript(): void {
  const srcHtmlPath = "src/ui.html";
  const distJsPath = "dist/ui.js";
  const distHtmlPath = "dist/ui.html";
  const marker = '<script src="ui.js"></script>';

  if (!existsSync(srcHtmlPath)) {
    throw new Error(`Missing ${srcHtmlPath}`);
  }
  if (!existsSync(distJsPath)) {
    throw new Error(`Missing ${distJsPath}`);
  }

  const html = readFileSync(srcHtmlPath, "utf-8");
  if (!html.includes(marker)) {
    throw new Error(`Expected marker not found in ${srcHtmlPath}: ${marker}`);
  }

  const js = readFileSync(distJsPath, "utf-8");
  // Guard against accidental script tag termination inside the bundle
  const safeJs = js.replaceAll("</script", "<\\/script");
  const out = html.replace(marker, `<script>\n${safeJs}\n</script>`);

  writeFileSync(distHtmlPath, out);
  console.log(`Wrote ${distHtmlPath} with inline UI script`);
}

const PLUGIN_VERSION = getPluginVersion();

export default defineConfig([
  {
    entry: ["src/code.ts"],
    format: ["iife"],
    target: "es2019",
    outDir: "dist",
    platform: "browser",
    bundle: true,
    splitting: false,
    sourcemap: false,
    noExternal: ["@figram/core"],
    outExtension: () => ({ js: ".js" }),
    define: {
      __PLUGIN_VERSION__: JSON.stringify(PLUGIN_VERSION),
    },
  },
  {
    entry: ["src/ui.ts"],
    format: ["iife"],
    target: "es2019",
    outDir: "dist",
    platform: "browser",
    bundle: true,
    minify: true,
    splitting: false,
    sourcemap: false,
    outExtension: () => ({ js: ".js" }),
    define: {
      __PLUGIN_VERSION__: JSON.stringify(PLUGIN_VERSION),
    },
    onSuccess: async () => {
      embedUiScript();
    },
  },
]);
