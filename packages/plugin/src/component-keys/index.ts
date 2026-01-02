/**
 * Component Key Registry
 *
 * Maps provider kinds to FigJam component keys for using
 * FigJam's built-in cloud provider shapes instead of embedded icons.
 */

import awsKeys from "./aws.json";
import azureKeys from "./azure.json";
import gcpKeys from "./gcp.json";

const AWS_COMPONENT_KEYS: Record<string, string> = awsKeys;
const AZURE_COMPONENT_KEYS: Record<string, string> = azureKeys;
const GCP_COMPONENT_KEYS: Record<string, string> = gcpKeys;

/**
 * Get the FigJam component key for a provider/kind combination
 * Returns null if no key is available
 */
export function getComponentKey(provider: string, kind: string): string | null {
  switch (provider) {
    case "aws":
      return AWS_COMPONENT_KEYS[kind] ?? null;
    case "azure":
      return AZURE_COMPONENT_KEYS[kind] ?? null;
    case "gcp":
      return GCP_COMPONENT_KEYS[kind] ?? null;
    default:
      return null;
  }
}
