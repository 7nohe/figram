/**
 * Icon registry utilities
 *
 * Shared functions for working with IRIconRegistry across CLI and Plugin.
 */

import type { IRIconRegistry } from "./types";

/**
 * Normalize icons to ensure non-null registry
 */
export function normalizeIcons(icons: IRIconRegistry | null | undefined): IRIconRegistry {
  return icons ?? {};
}

/**
 * Deep equality check for icon registries
 */
export function iconsEqual(
  a: IRIconRegistry | null | undefined,
  b: IRIconRegistry | null | undefined,
): boolean {
  const aRegistry = a ?? {};
  const bRegistry = b ?? {};
  const aProviders = Object.keys(aRegistry);
  const bProviders = Object.keys(bRegistry);

  if (aProviders.length !== bProviders.length) return false;

  for (const provider of aProviders) {
    const aKinds = aRegistry[provider];
    const bKinds = bRegistry[provider];
    if (!bKinds) return false;

    const aKindKeys = Object.keys(aKinds);
    const bKindKeys = Object.keys(bKinds);
    if (aKindKeys.length !== bKindKeys.length) return false;

    for (const kind of aKindKeys) {
      if (aKinds[kind] !== bKinds[kind]) return false;
    }
  }

  return true;
}

/**
 * Count total icons in a registry
 */
export function countIcons(registry: IRIconRegistry | null | undefined): number {
  if (!registry) return 0;
  let count = 0;
  for (const mapping of Object.values(registry)) {
    count += Object.keys(mapping).length;
  }
  return count;
}

/**
 * Merge multiple icon registries (later ones override earlier ones)
 */
export function mergeIconRegistries(
  ...registries: (IRIconRegistry | null | undefined)[]
): IRIconRegistry {
  const result: IRIconRegistry = {};

  for (const registry of registries) {
    if (!registry) continue;

    for (const [provider, mapping] of Object.entries(registry)) {
      if (!result[provider]) {
        result[provider] = {};
      }
      Object.assign(result[provider], mapping);
    }
  }

  return result;
}
