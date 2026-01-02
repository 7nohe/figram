/**
 * Figram Core Error Types
 *
 * Base error classes shared across all packages.
 * CLI and Plugin extend these with their own specific errors.
 */

/**
 * Base error class for all Figram errors
 */
export class FigramError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "FigramError";
  }
}

/**
 * Error thrown when validation fails
 */
export class FigramValidationError extends FigramError {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(message, "VALIDATION_ERROR", { path });
    this.name = "FigramValidationError";
  }
}

/**
 * Validation result with multiple errors
 */
export interface ValidationErrorDetail {
  path: string;
  message: string;
}

/**
 * Error thrown when multiple validation errors occur
 */
export class FigramValidationErrors extends FigramError {
  constructor(public readonly errors: ValidationErrorDetail[]) {
    const formatted = errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n");
    super(`Validation errors:\n${formatted}`, "VALIDATION_ERRORS", { errors });
    this.name = "FigramValidationErrors";
  }
}
