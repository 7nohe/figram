import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CliError } from "../errors";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PackageInfo {
  name: string;
  path: string;
  version: string;
  packageJson: PackageJson;
}

type BumpType = "major" | "minor" | "patch";

/**
 * Find the monorepo root by looking for the root package.json with workspaces
 */
function findMonorepoRoot(): string {
  // Start from CLI package and go up
  let dir = resolve(__dirname, "..", "..");

  for (let i = 0; i < 5; i++) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (pkg.workspaces) {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    dir = dirname(dir);
  }

  throw new CliError("Could not find monorepo root", 1);
}

/**
 * Get all package information from the monorepo
 */
function getPackages(): PackageInfo[] {
  const root = findMonorepoRoot();
  const packagesDir = join(root, "packages");

  const packages: PackageInfo[] = [];
  const packageNames = ["core", "cli", "plugin"];

  for (const name of packageNames) {
    const pkgPath = join(packagesDir, name, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(pkgPath, "utf-8")) as PackageJson;
        packages.push({
          name: packageJson.name,
          path: join(packagesDir, name),
          version: packageJson.version,
          packageJson,
        });
      } catch (err) {
        throw new CliError(`Failed to read ${pkgPath}: ${err}`, 1);
      }
    }
  }

  return packages;
}

/**
 * Parse a semver version string
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new CliError(`Invalid version format: ${version}`, 1);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Bump a version based on bump type
 */
function bumpVersion(version: string, type: BumpType): string {
  const parsed = parseVersion(version);

  switch (type) {
    case "major":
      return `${parsed.major + 1}.0.0`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

/**
 * Show versions of all packages
 */
export async function versionShowCommand(): Promise<void> {
  const packages = getPackages();

  console.log("\nFigram Package Versions\n");
  console.log("Package              Version");
  console.log("─".repeat(40));

  for (const pkg of packages) {
    const name = pkg.name.padEnd(20);
    console.log(`${name} ${pkg.version}`);
  }

  console.log();
}

/**
 * Check version consistency across packages
 */
export async function versionCheckCommand(): Promise<void> {
  const packages = getPackages();
  const issues: string[] = [];

  console.log("\nChecking version consistency...\n");

  // Check if all packages have the same version (for synchronized releases)
  const versions = new Set(packages.map((p) => p.version));

  if (versions.size > 1) {
    console.log("Package versions differ (this may be intentional):");
    for (const pkg of packages) {
      console.log(`  ${pkg.name}: ${pkg.version}`);
    }
    console.log();
  }

  // Check workspace dependency consistency
  const corePackage = packages.find((p) => p.name === "@figram/core");

  if (corePackage) {
    for (const pkg of packages) {
      if (pkg.name === "@figram/core") continue;

      const deps = { ...pkg.packageJson.dependencies, ...pkg.packageJson.devDependencies };
      const coreDep = deps["@figram/core"];

      if (coreDep && coreDep !== "workspace:*") {
        issues.push(`${pkg.name} has non-workspace dependency on @figram/core: ${coreDep}`);
      }
    }
  }

  // Check for valid semver
  for (const pkg of packages) {
    try {
      parseVersion(pkg.version);
    } catch {
      issues.push(`${pkg.name} has invalid version: ${pkg.version}`);
    }
  }

  if (issues.length > 0) {
    console.log("Issues found:");
    for (const issue of issues) {
      console.log(`  ⚠ ${issue}`);
    }
    console.log();
    throw new CliError("Version check failed", 1);
  }

  console.log("✓ All version checks passed\n");
}

/**
 * Bump versions across packages
 */
export async function versionBumpCommand(
  type: BumpType,
  options: { packages?: string; dryRun?: boolean },
): Promise<void> {
  const allPackages = getPackages();

  // Determine which packages to bump
  let packagesToUpdate: PackageInfo[];

  if (options.packages) {
    const requestedNames = options.packages.split(",").map((n) => n.trim());
    packagesToUpdate = allPackages.filter((p) => {
      const shortName = p.name.replace("@figram/", "");
      return requestedNames.includes(p.name) || requestedNames.includes(shortName);
    });

    if (packagesToUpdate.length === 0) {
      throw new CliError(`No matching packages found for: ${options.packages}`, 1);
    }
  } else {
    // Default: bump all packages
    packagesToUpdate = allPackages;
  }

  console.log(`\nVersion bump: ${type}\n`);

  const updates: Array<{ pkg: PackageInfo; oldVersion: string; newVersion: string }> = [];

  for (const pkg of packagesToUpdate) {
    const oldVersion = pkg.version;
    const newVersion = bumpVersion(oldVersion, type);
    updates.push({ pkg, oldVersion, newVersion });
  }

  // Show planned changes
  console.log("Planned changes:");
  console.log("─".repeat(50));
  for (const { pkg, oldVersion, newVersion } of updates) {
    console.log(`  ${pkg.name}: ${oldVersion} → ${newVersion}`);
  }
  console.log();

  if (options.dryRun) {
    console.log("Dry run - no changes made\n");
    return;
  }

  // Apply changes
  for (const { pkg, newVersion } of updates) {
    const pkgJsonPath = join(pkg.path, "package.json");
    const content = readFileSync(pkgJsonPath, "utf-8");
    const updatedContent = content.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
    writeFileSync(pkgJsonPath, updatedContent);
    console.log(`  ✓ Updated ${pkg.name}`);
  }

  console.log("\nVersion bump complete!\n");
  console.log("Next steps:");
  console.log("  1. Update CHANGELOG.md for each package");
  console.log("  2. Run: bun run build && bun run check && bun test");
  console.log("  3. Commit: git commit -am 'chore: bump version to X.Y.Z'");
  console.log(`  4. Tag: git tag v${updates[0]?.newVersion ?? "X.Y.Z"}`);
  console.log();
}

/**
 * Sync all package versions to match a target version
 */
export async function versionSyncCommand(
  targetVersion: string,
  options: { dryRun?: boolean },
): Promise<void> {
  // Validate target version
  try {
    parseVersion(targetVersion);
  } catch {
    throw new CliError(`Invalid target version: ${targetVersion}`, 1);
  }

  const packages = getPackages();

  console.log(`\nSyncing all packages to version ${targetVersion}\n`);

  const updates: Array<{ pkg: PackageInfo; oldVersion: string }> = [];

  for (const pkg of packages) {
    if (pkg.version !== targetVersion) {
      updates.push({ pkg, oldVersion: pkg.version });
    }
  }

  if (updates.length === 0) {
    console.log("All packages already at target version\n");
    return;
  }

  console.log("Planned changes:");
  console.log("─".repeat(50));
  for (const { pkg, oldVersion } of updates) {
    console.log(`  ${pkg.name}: ${oldVersion} → ${targetVersion}`);
  }
  console.log();

  if (options.dryRun) {
    console.log("Dry run - no changes made\n");
    return;
  }

  // Apply changes
  for (const { pkg } of updates) {
    const pkgJsonPath = join(pkg.path, "package.json");
    const content = readFileSync(pkgJsonPath, "utf-8");
    const updatedContent = content.replace(/"version":\s*"[^"]+"/, `"version": "${targetVersion}"`);
    writeFileSync(pkgJsonPath, updatedContent);
    console.log(`  ✓ Updated ${pkg.name}`);
  }

  console.log("\nVersion sync complete!\n");
}
