export interface IconEntry {
  label: string;
  category: string;
}

export type IconsData = Record<string, Record<string, IconEntry>>;

// Lazy-loaded icons data
let iconsData: IconsData | null = null;

/**
 * Get icons data, loading from JSON file on first call.
 * The JSON is bundled by esbuild.
 */
export function getIconsData(): IconsData {
  if (iconsData === null) {
    // Import the bundled JSON data
    iconsData = require("../data/icons.json") as IconsData;
  }
  return iconsData;
}

/**
 * Get all kind values for a specific provider
 */
export function getKindsForProvider(provider: string): Record<string, IconEntry> | undefined {
  return getIconsData()[provider];
}

/**
 * Get all supported providers
 */
export function getSupportedProviders(): string[] {
  return Object.keys(getIconsData());
}
