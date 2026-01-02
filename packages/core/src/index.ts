// Types

// Codec utilities
export { base64ToUint8Array, uint8ArrayToBase64 } from "./codec";
export { diff } from "./diff";
export {
  FigramError,
  FigramValidationError,
  FigramValidationErrors,
  type ValidationErrorDetail,
} from "./errors";
// Icon utilities
export { countIcons, iconsEqual, mergeIconRegistries, normalizeIcons } from "./icons";
export { normalize } from "./normalize";
export type {
  DSLDocument,
  DSLEdge,
  DSLIcons,
  // DSL Types
  DSLLayout,
  DSLNode,
  ErrorMessage,
  FullMessage,
  // WebSocket Protocol Types
  HelloMessage,
  IconsMessage,
  IRDocument,
  IREdge,
  IRIconRegistry,
  // IR Types
  IRNode,
  Patch,
  PatchMessage,
  // Patch Types
  PatchOp,
  RequestFullMessage,
  // Validation Types
  ValidationError,
  ValidationResult,
  WelcomeMessage,
  WSMessage,
} from "./types";
// Functions
export { validate } from "./validate";
// Version utilities
export { areVersionsCompatible, type MajorMinor, parseMajorMinor } from "./version";
