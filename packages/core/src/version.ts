/**
 * Version comparison utilities
 *
 * Used for checking CLI/Plugin version compatibility.
 */

export interface MajorMinor {
  major: number;
  minor: number;
}

/**
 * Parse major.minor version from a version string
 *
 * @example
 * parseMajorMinor("1.2.3") // { major: 1, minor: 2 }
 * parseMajorMinor("0.1.0-beta") // { major: 0, minor: 1 }
 * parseMajorMinor("invalid") // null
 */
export function parseMajorMinor(version: string): MajorMinor | null {
  const match = version.match(/^(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: parseInt(match[1], 10), minor: parseInt(match[2], 10) };
}

/**
 * Check if two versions are compatible (same major.minor)
 *
 * Returns true if versions can't be parsed (assumes compatible).
 */
export function areVersionsCompatible(v1: string, v2: string): boolean {
  const parsed1 = parseMajorMinor(v1);
  const parsed2 = parseMajorMinor(v2);
  if (!parsed1 || !parsed2) return true; // Assume compatible if can't parse
  return parsed1.major === parsed2.major && parsed1.minor === parsed2.minor;
}
