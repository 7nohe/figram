import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: false,
  // Bundle @figram/core into the output (no need to publish separately)
  noExternal: ["@figram/core"],
  // Keep ws and yaml as external dependencies (installed via npm)
  external: ["ws", "yaml"],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
