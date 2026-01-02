import type { DSLDocument, DSLEdge, DSLNode, ValidationError, ValidationResult } from "./types";

/** Matches #RGB or #RRGGBB format */
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Validates a DSL document
 */
export function validate(doc: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Basic type check
  if (!doc || typeof doc !== "object") {
    return { ok: false, errors: [{ path: "", message: "Document must be an object" }] };
  }

  const d = doc as Record<string, unknown>;
  const nodeIds = new Set<string>();
  let nodes: DSLNode[] | null = null;

  // Version check
  if (typeof d.version !== "number") {
    errors.push({ path: "version", message: "version is required and must be a number" });
  }

  // docId required check
  if (typeof d.docId !== "string" || d.docId.trim() === "") {
    errors.push({ path: "docId", message: "docId is required and must be a non-empty string" });
  }

  // Nodes check
  if (!Array.isArray(d.nodes)) {
    errors.push({ path: "nodes", message: "nodes must be an array" });
  } else {
    nodes = d.nodes as DSLNode[];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const path = `nodes[${i}]`;

      // id required and duplicate check
      if (typeof node.id !== "string" || node.id.trim() === "") {
        errors.push({ path: `${path}.id`, message: "node id is required" });
      } else if (nodeIds.has(node.id)) {
        errors.push({ path: `${path}.id`, message: `duplicate node id: ${node.id}` });
      } else {
        nodeIds.add(node.id);
      }

      // Provider check
      if (typeof node.provider !== "string") {
        errors.push({ path: `${path}.provider`, message: "provider is required" });
      }

      // Kind check
      if (typeof node.kind !== "string") {
        errors.push({ path: `${path}.kind`, message: "kind is required" });
      }

      // Layout check (with auto-layout support)
      const hasParent = !!node.parent;
      const layout = node.layout;

      // Top-level nodes require layout
      if (!hasParent && (!layout || typeof layout !== "object")) {
        errors.push({ path: `${path}.layout`, message: "layout is required for top-level nodes" });
      }

      if (layout && typeof layout === "object") {
        const hasX = layout.x !== undefined;
        const hasY = layout.y !== undefined;

        // Partial coordinate specification is not allowed
        if (hasX !== hasY) {
          errors.push({
            path: `${path}.layout`,
            message: "layout.x and layout.y must be both specified or both omitted",
          });
        }

        // Top-level nodes require x and y
        if (!hasParent && !hasX) {
          errors.push({
            path: `${path}.layout.x`,
            message: "layout.x is required for top-level nodes",
          });
        }
        if (!hasParent && !hasY) {
          errors.push({
            path: `${path}.layout.y`,
            message: "layout.y is required for top-level nodes",
          });
        }

        // Type validation for provided values
        if (hasX && typeof layout.x !== "number") {
          errors.push({ path: `${path}.layout.x`, message: "layout.x must be a number" });
        }
        if (hasY && typeof layout.y !== "number") {
          errors.push({ path: `${path}.layout.y`, message: "layout.y must be a number" });
        }
        if (layout.w !== undefined && typeof layout.w !== "number") {
          errors.push({ path: `${path}.layout.w`, message: "layout.w must be a number" });
        }
        if (layout.h !== undefined && typeof layout.h !== "number") {
          errors.push({ path: `${path}.layout.h`, message: "layout.h must be a number" });
        }
      }
    }

    // Parent existence check
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.parent && !nodeIds.has(node.parent)) {
        errors.push({
          path: `nodes[${i}].parent`,
          message: `parent '${node.parent}' does not exist`,
        });
      }
    }

    // Parent cycle check
    const cycleErrors = detectCycles(nodes);
    errors.push(...cycleErrors);
  }

  // Edges check
  if (d.edges !== undefined) {
    if (!Array.isArray(d.edges)) {
      errors.push({ path: "edges", message: "edges must be an array" });
    } else {
      const edgeIds = new Set<string>();

      const edges = d.edges as DSLEdge[];
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const path = `edges[${i}]`;

        // id required and duplicate check
        if (typeof edge.id !== "string" || edge.id.trim() === "") {
          errors.push({ path: `${path}.id`, message: "edge id is required" });
        } else if (edgeIds.has(edge.id)) {
          errors.push({ path: `${path}.id`, message: `duplicate edge id: ${edge.id}` });
        } else {
          edgeIds.add(edge.id);
        }

        // from existence check
        if (typeof edge.from !== "string") {
          errors.push({ path: `${path}.from`, message: "from is required" });
        } else if (!nodeIds.has(edge.from)) {
          errors.push({ path: `${path}.from`, message: `from '${edge.from}' does not exist` });
        }

        // to existence check
        if (typeof edge.to !== "string") {
          errors.push({ path: `${path}.to`, message: "to is required" });
        } else if (!nodeIds.has(edge.to)) {
          errors.push({ path: `${path}.to`, message: `to '${edge.to}' does not exist` });
        }

        // color format check (optional field)
        if (edge.color !== undefined) {
          if (typeof edge.color !== "string") {
            errors.push({ path: `${path}.color`, message: "color must be a string" });
          } else if (!HEX_COLOR_REGEX.test(edge.color)) {
            errors.push({
              path: `${path}.color`,
              message: "color must be a valid HEX color (#RGB or #RRGGBB)",
            });
          }
        }
      }
    }
  }

  // Icons check (optional field)
  if (d.icons !== undefined) {
    if (typeof d.icons !== "object" || d.icons === null || Array.isArray(d.icons)) {
      errors.push({ path: "icons", message: "icons must be an object" });
    } else {
      const icons = d.icons as Record<string, unknown>;
      for (const [provider, mapping] of Object.entries(icons)) {
        const providerPath = `icons.${provider}`;

        if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) {
          errors.push({ path: providerPath, message: "icon mapping must be an object" });
          continue;
        }

        const kindMapping = mapping as Record<string, unknown>;
        for (const [kind, iconPath] of Object.entries(kindMapping)) {
          if (typeof iconPath !== "string" || iconPath.trim() === "") {
            errors.push({
              path: `${providerPath}.${kind}`,
              message: "icon path must be a non-empty string",
            });
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, document: doc as DSLDocument };
}

/**
 * Detects parent cycles
 */
function detectCycles(nodes: DSLNode[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeMap = new Map<string, DSLNode>();

  for (const node of nodes) {
    if (node.id) {
      nodeMap.set(node.id, node);
    }
  }

  for (const node of nodes) {
    if (!node.parent) continue;

    const visited = new Set<string>();
    let current: string | undefined = node.id;

    while (current) {
      if (visited.has(current)) {
        errors.push({
          path: `nodes`,
          message: `cycle detected involving node '${node.id}'`,
        });
        break;
      }
      visited.add(current);
      const currentNode = nodeMap.get(current);
      current = currentNode?.parent;
    }
  }

  return errors;
}
