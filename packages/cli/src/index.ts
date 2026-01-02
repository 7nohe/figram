import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { buildCommand } from "./commands/build";
import { initCommand } from "./commands/init";
import { serveCommand } from "./commands/serve";
import {
  versionBumpCommand,
  versionCheckCommand,
  versionShowCommand,
  versionSyncCommand,
} from "./commands/version";
import { CliError } from "./errors";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function createProgram(): Command {
  const program = new Command();

  program
    .name("figram")
    .description("YAML-driven architecture diagrams for FigJam")
    .version(getVersion(), "-v, --version", "Show version")
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .command("init")
    .description("Create a diagram.yaml template")
    .action(async () => {
      await initCommand();
    });

  program
    .command("build")
    .description("Build YAML to IR JSON")
    .argument("[file]", "Input YAML file", "diagram.yaml")
    .option("-o, --output <file>", "Output file path (default: input file with .json extension)")
    .action(async (file: string, options: { output?: string }) => {
      await buildCommand(file, options.output);
    });

  program
    .command("serve", { isDefault: true })
    .description("Start WebSocket server with watch")
    .argument("[file]", "Input YAML file", "diagram.yaml")
    .option("-p, --port <port>", "WebSocket server port", "3456")
    .option("--host <host>", "Host to bind", "127.0.0.1")
    .option("--no-watch", "Disable file watching")
    .option("--allow-remote", "Allow connections from remote hosts")
    .option("--secret <secret>", "Require secret for connection")
    .option("--icons <path>", "Path to icons configuration file (figram-icons.yaml)")
    .action(
      async (
        file: string,
        options: {
          port?: string;
          host?: string;
          watch?: boolean;
          allowRemote?: boolean;
          secret?: string;
          icons?: string;
        },
      ) => {
        const port = parseInt(options.port ?? "3456", 10);
        if (!Number.isFinite(port) || port < 1 || port > 65535) {
          throw new CliError(`Invalid port: ${options.port}. Use a value between 1 and 65535.`, 1);
        }

        await serveCommand(file, {
          port,
          host: options.host ?? "127.0.0.1",
          watch: options.watch ?? true,
          allowRemote: options.allowRemote ?? false,
          secret: options.secret,
          iconsFile: options.icons,
        });
      },
    );

  // Version management command with subcommands
  const versionCmd = program
    .command("version")
    .description("Manage package versions across the monorepo");

  versionCmd
    .command("show", { isDefault: true })
    .description("Show versions of all packages")
    .action(async () => {
      await versionShowCommand();
    });

  versionCmd
    .command("check")
    .description("Check version consistency across packages")
    .action(async () => {
      await versionCheckCommand();
    });

  versionCmd
    .command("bump <type>")
    .description("Bump versions (major, minor, or patch)")
    .option("-p, --packages <names>", "Comma-separated package names to update (default: all)")
    .option("-n, --dry-run", "Show what would be changed without making changes")
    .action(async (type: string, options: { packages?: string; dryRun?: boolean }) => {
      if (!["major", "minor", "patch"].includes(type)) {
        throw new CliError(`Invalid bump type: ${type}. Use major, minor, or patch.`, 1);
      }
      await versionBumpCommand(type as "major" | "minor" | "patch", options);
    });

  versionCmd
    .command("sync <version>")
    .description("Sync all packages to a specific version")
    .option("-n, --dry-run", "Show what would be changed without making changes")
    .action(async (version: string, options: { dryRun?: boolean }) => {
      await versionSyncCommand(version, options);
    });

  return program;
}

async function main() {
  const program = createProgram();

  // Show usage when no command is given.
  if (process.argv.slice(2).length === 0) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  if (err instanceof CliError) {
    console.error(`Error: ${err.message}`);
    process.exit(err.exitCode);
  }
  console.error("Error:", err.message);
  process.exit(1);
});
