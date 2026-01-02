import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findIconsFile, loadIconAsBase64, loadIconsFile, resolveIcons } from "./icons";

describe("icons", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `figram-icons-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("loadIconAsBase64", () => {
    it("should load PNG file as base64", async () => {
      // Create a minimal PNG file (1x1 transparent pixel)
      const pngData = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );
      const pngPath = join(tempDir, "test.png");
      writeFileSync(pngPath, pngData);

      const result = await loadIconAsBase64(pngPath, tempDir);
      expect(result).toBe(pngData.toString("base64"));
    });

    it("should resolve relative paths from basePath", async () => {
      const iconDir = join(tempDir, "icons");
      mkdirSync(iconDir);
      const pngPath = join(iconDir, "ec2.png");
      writeFileSync(pngPath, Buffer.from("fake-png-data"));

      const basePath = join(tempDir, "diagram.yaml");
      const result = await loadIconAsBase64("./icons/ec2.png", basePath);
      expect(result).toBe(Buffer.from("fake-png-data").toString("base64"));
    });

    it("should reject unsupported formats", async () => {
      const txtPath = join(tempDir, "test.txt");
      writeFileSync(txtPath, "not an image");

      await expect(loadIconAsBase64(txtPath, tempDir)).rejects.toThrow("Unsupported image format");
    });

    it("should reject SVG format", async () => {
      const svgPath = join(tempDir, "test.svg");
      writeFileSync(svgPath, "<svg></svg>");

      await expect(loadIconAsBase64(svgPath, tempDir)).rejects.toThrow("Unsupported image format");
    });
  });

  describe("resolveIcons", () => {
    it("should resolve multiple icons", async () => {
      const iconDir = join(tempDir, "icons");
      mkdirSync(iconDir);
      writeFileSync(join(iconDir, "ec2.png"), "ec2-data");
      writeFileSync(join(iconDir, "rds.png"), "rds-data");

      const basePath = join(tempDir, "diagram.yaml");
      const result = await resolveIcons(
        {
          aws: {
            "compute.ec2": "./icons/ec2.png",
            "database.rds": "./icons/rds.png",
          },
        },
        basePath,
      );

      expect(result.aws["compute.ec2"]).toBe(Buffer.from("ec2-data").toString("base64"));
      expect(result.aws["database.rds"]).toBe(Buffer.from("rds-data").toString("base64"));
    });

    it("should handle missing files gracefully", async () => {
      const basePath = join(tempDir, "diagram.yaml");
      const result = await resolveIcons(
        {
          aws: {
            "compute.ec2": "./nonexistent.png",
          },
        },
        basePath,
      );

      // Should not throw, but should not include the missing icon
      expect(result.aws["compute.ec2"]).toBeUndefined();
    });

    it("should support multiple providers", async () => {
      const iconDir = join(tempDir, "icons");
      mkdirSync(iconDir);
      writeFileSync(join(iconDir, "ec2.png"), "aws-ec2");
      writeFileSync(join(iconDir, "gce.png"), "gcp-gce");

      const basePath = join(tempDir, "diagram.yaml");
      const result = await resolveIcons(
        {
          aws: { "compute.ec2": "./icons/ec2.png" },
          gcp: { "compute.gce": "./icons/gce.png" },
        },
        basePath,
      );

      expect(result.aws["compute.ec2"]).toBeDefined();
      expect(result.gcp["compute.gce"]).toBeDefined();
    });
  });

  describe("findIconsFile", () => {
    it("should find figram-icons.yaml", () => {
      const iconsPath = join(tempDir, "figram-icons.yaml");
      writeFileSync(iconsPath, "version: 1\nicons: {}");

      const diagramPath = join(tempDir, "diagram.yaml");
      const result = findIconsFile(diagramPath);
      expect(result).toBe(iconsPath);
    });

    it("should find figram-icons.yml", () => {
      const iconsPath = join(tempDir, "figram-icons.yml");
      writeFileSync(iconsPath, "version: 1\nicons: {}");

      const diagramPath = join(tempDir, "diagram.yaml");
      const result = findIconsFile(diagramPath);
      expect(result).toBe(iconsPath);
    });

    it("should return null when no icons file exists", () => {
      const diagramPath = join(tempDir, "diagram.yaml");
      const result = findIconsFile(diagramPath);
      expect(result).toBeNull();
    });

    it("should prefer .yaml over .yml", () => {
      writeFileSync(join(tempDir, "figram-icons.yaml"), "yaml version");
      writeFileSync(join(tempDir, "figram-icons.yml"), "yml version");

      const diagramPath = join(tempDir, "diagram.yaml");
      const result = findIconsFile(diagramPath);
      expect(result).toBe(join(tempDir, "figram-icons.yaml"));
    });
  });

  describe("loadIconsFile", () => {
    it("should load and resolve icons file", async () => {
      const iconDir = join(tempDir, "icons");
      mkdirSync(iconDir);
      writeFileSync(join(iconDir, "ec2.png"), "ec2-data");

      const iconsPath = join(tempDir, "figram-icons.yaml");
      writeFileSync(
        iconsPath,
        `
version: 1
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
`,
      );

      const result = await loadIconsFile(iconsPath);
      expect(result.error).toBeNull();
      expect(result.icons?.aws["compute.ec2"]).toBe(Buffer.from("ec2-data").toString("base64"));
    });

    it("should return error for invalid YAML", async () => {
      const iconsPath = join(tempDir, "figram-icons.yaml");
      writeFileSync(iconsPath, "invalid: [yaml: content");

      const result = await loadIconsFile(iconsPath);
      expect(result.error).not.toBeNull();
      expect(result.icons).toBeNull();
    });

    it("should return error for missing icons field", async () => {
      const iconsPath = join(tempDir, "figram-icons.yaml");
      writeFileSync(iconsPath, "version: 1");

      const result = await loadIconsFile(iconsPath);
      expect(result.error).toBe("Icons file must have an 'icons' field");
      expect(result.icons).toBeNull();
    });
  });
});
