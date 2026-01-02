/**
 * Icon Utilities for Figram
 *
 * This module provides utility functions for handling icons.
 * Icons are provided via CLI custom icons (figram-icons.yaml).
 *
 * The primary rendering method uses FigJam's component keys (see component-keys/).
 * CLI-provided custom icons are used as a fallback.
 */

// Re-export base64 utility from core
export { base64ToUint8Array } from "@figram/core";

/**
 * Get icon base64 data for a provider and kind.
 * Falls back to parent kind (e.g., compute.lb.alb -> compute.lb -> compute).
 *
 * Note: This function always returns null. Icons are provided via CLI (receivedIcons).
 * @deprecated Use receivedIcons from state.ts instead.
 */
export function getIconForProviderKind(_provider: string, _kind: string): string | null {
  return null;
}

/**
 * Legacy function for AWS-only lookup.
 * @deprecated Use receivedIcons from state.ts instead.
 */
export function getIconForKind(_kind: string): string | null {
  return null;
}
