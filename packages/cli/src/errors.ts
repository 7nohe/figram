/**
 * CLI Error Classes
 *
 * Commands throw these errors instead of calling process.exit() directly.
 * The entry point (index.ts) catches them and handles exit codes.
 */

export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export class FileNotFoundError extends CliError {
  constructor(path: string) {
    super(`File not found: ${path}`, 1);
    this.name = "FileNotFoundError";
  }
}

export class FileExistsError extends CliError {
  constructor(path: string) {
    super(`${path} already exists`, 1);
    this.name = "FileExistsError";
  }
}

export class YamlParseError extends CliError {
  constructor(message: string) {
    super(`Failed to parse YAML: ${message}`, 1);
    this.name = "YamlParseError";
  }
}

export class ValidationError extends CliError {
  constructor(errors: Array<{ path: string; message: string }>) {
    const formatted = errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n");
    super(`Validation errors:\n${formatted}`, 1);
    this.name = "ValidationError";
  }
}
