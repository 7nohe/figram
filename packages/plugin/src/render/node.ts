import type { IRNode } from "@figram/core";
import { getComponentKey } from "../component-keys";
import { base64ToUint8Array, getIconForProviderKind } from "../icons";
import {
  componentCache,
  getDocRoot,
  ICON_PADDING,
  ICON_SIZE,
  iconImageCache,
  nodeIndex,
  receivedIcons,
} from "../state";
import { ensureTextFont, getOrCreateNode, loadMediumFont } from "./utils";

// =============================================================================
// Constants
// =============================================================================

const CUSTOM_ICON_SIZE = 64;
const CUSTOM_ICON_PADDING = 8;
const CUSTOM_ICON_SPACING = 4;
const CUSTOM_ICON_CORNER_RADIUS = 8;
const CUSTOM_ICON_FONT_SIZE = 11;

const BUILTIN_ICON_SIZE = 80;
const PLAIN_NODE_FONT_SIZE = 12;

// VPC/VNet kinds that should render as sections
const VPC_KINDS = new Set(["network.vpc", "virtual_networks", "virtual_networks_classic"]);

// Subnet kinds that should render as sections
const SUBNET_KINDS = new Set(["network.subnet", "subnet"]);

// =============================================================================
// Icon Resolution
// =============================================================================

/** Get icon base64 from received icons (with hierarchical fallback) */
export function getReceivedIcon(provider: string, kind: string): string | null {
  const providerIcons = receivedIcons.get(provider);
  if (!providerIcons) {
    return null;
  }

  // Direct lookup
  if (providerIcons.has(kind)) {
    return providerIcons.get(kind)!;
  }

  // Hierarchical fallback (compute.ec2.custom -> compute.ec2 -> compute)
  const parts = kind.split(".");
  while (parts.length > 1) {
    parts.pop();
    const parentKind = parts.join(".");
    if (providerIcons.has(parentKind)) {
      return providerIcons.get(parentKind)!;
    }
  }

  return null;
}

/** Get or create image hash for an icon */
export async function getIconImageHash(provider: string, kind: string): Promise<string | null> {
  const cacheKey = `${provider}:${kind}`;

  if (iconImageCache.has(cacheKey)) {
    return iconImageCache.get(cacheKey)!;
  }

  // Try received icons first (from CLI), then fall back to baked-in icons
  const iconBase64 = getReceivedIcon(provider, kind) ?? getIconForProviderKind(provider, kind);

  if (!iconBase64) {
    return null;
  }

  const bytes = base64ToUint8Array(iconBase64);
  const image = figma.createImage(bytes);
  iconImageCache.set(cacheKey, image.hash);

  return image.hash;
}

// =============================================================================
// Component Import
// =============================================================================

/** Import or get cached component by key */
export async function getOrImportComponent(componentKey: string): Promise<ComponentNode | null> {
  if (componentCache.has(componentKey)) {
    return componentCache.get(componentKey) || null;
  }

  try {
    if (typeof figma.importComponentByKeyAsync !== "function") {
      return null;
    }
    const component = await figma.importComponentByKeyAsync(componentKey);
    componentCache.set(componentKey, component);
    return component;
  } catch (e) {
    console.warn("Failed to import component:", componentKey, e);
    return null;
  }
}

// =============================================================================
// Node Styling
// =============================================================================

export interface NodeStyle {
  fill: RGB;
  stroke: RGB;
  strokeWeight: number;
  defaultW: number;
  defaultH: number;
  isSection: boolean;
}

/** Style configuration based on kind */
export function getNodeStyle(kind: string): NodeStyle {
  if (VPC_KINDS.has(kind)) {
    return {
      fill: { r: 0.96, g: 0.98, b: 1 },
      stroke: { r: 0.2, g: 0.4, b: 0.8 },
      strokeWeight: 2,
      defaultW: 800,
      defaultH: 600,
      isSection: true,
    };
  }

  if (SUBNET_KINDS.has(kind)) {
    return {
      fill: { r: 0.98, g: 0.99, b: 1 },
      stroke: { r: 0.4, g: 0.6, b: 0.9 },
      strokeWeight: 1.5,
      defaultW: 360,
      defaultH: 300,
      isSection: true,
    };
  }

  return {
    fill: { r: 1, g: 1, b: 1 },
    stroke: { r: 0.6, g: 0.6, b: 0.6 },
    strokeWeight: 1,
    defaultW: 140,
    defaultH: 60,
    isSection: false,
  };
}

// =============================================================================
// Node Type Renderers
// =============================================================================

/** Render a section node (VPC/Subnet) */
function renderSectionNode(
  irNode: IRNode,
  existing: SceneNode | undefined,
  w: number,
  h: number,
): SectionNode {
  const section = getOrCreateNode(
    irNode.id,
    existing,
    (node): node is SectionNode => node.type === "SECTION",
    () => figma.createSection(),
  );

  section.name = irNode.label;
  section.resizeWithoutConstraints(w, h);

  return section;
}

/** Render a FigJam component instance node */
async function renderComponentNode(
  irNode: IRNode,
  existing: SceneNode | undefined,
  component: ComponentNode,
): Promise<InstanceNode> {
  const instance = getOrCreateNode(
    irNode.id,
    existing,
    (node): node is InstanceNode => node.type === "INSTANCE",
    () => component.createInstance(),
  );

  instance.name = irNode.label;

  // Resize component to match icon size (scale proportionally)
  const targetSize = ICON_SIZE + ICON_PADDING;
  const scale = targetSize / Math.max(instance.width, instance.height);
  instance.resize(instance.width * scale, instance.height * scale);

  // Update text content inside the component to use our label
  const textNodes = instance.findAll((n) => n.type === "TEXT") as TextNode[];
  for (const textNode of textNodes) {
    try {
      await ensureTextFont(textNode);
      textNode.characters = irNode.label;
    } catch (e) {
      console.warn("Could not update text in component:", e);
    }
  }

  return instance;
}

/** Render a custom icon node (Frame with icon + label below) */
async function renderCustomIconNode(
  irNode: IRNode,
  existing: SceneNode | undefined,
  iconHash: string,
): Promise<FrameNode> {
  const frame = getOrCreateNode(
    irNode.id,
    existing,
    (node): node is FrameNode => node.type === "FRAME",
    () => figma.createFrame(),
  );

  frame.name = irNode.label;
  frame.fills = [];

  // Find or create icon rectangle
  let iconRect = frame.findChild((n) => n.name === "__icon__") as RectangleNode | null;
  if (!iconRect) {
    iconRect = figma.createRectangle();
    iconRect.name = "__icon__";
    frame.appendChild(iconRect);
  }
  iconRect.resize(CUSTOM_ICON_SIZE, CUSTOM_ICON_SIZE);
  iconRect.y = CUSTOM_ICON_PADDING;
  iconRect.cornerRadius = CUSTOM_ICON_CORNER_RADIUS;
  iconRect.fills = [{ type: "IMAGE", imageHash: iconHash, scaleMode: "FIT" }];

  // Find or create label text
  let labelText = frame.findChild((n) => n.name === "__label__") as TextNode | null;
  if (!labelText) {
    labelText = figma.createText();
    labelText.name = "__label__";
    frame.appendChild(labelText);
  }
  await loadMediumFont();
  labelText.characters = irNode.label;
  labelText.fontSize = CUSTOM_ICON_FONT_SIZE;
  labelText.y = CUSTOM_ICON_PADDING + CUSTOM_ICON_SIZE + CUSTOM_ICON_SPACING;

  // Center elements horizontally and resize frame
  const frameWidth = Math.max(CUSTOM_ICON_SIZE, labelText.width) + CUSTOM_ICON_PADDING * 2;
  labelText.x = (frameWidth - labelText.width) / 2;
  iconRect.x = (frameWidth - CUSTOM_ICON_SIZE) / 2;

  const frameHeight =
    CUSTOM_ICON_SIZE + CUSTOM_ICON_SPACING + labelText.height + CUSTOM_ICON_PADDING * 2;
  frame.resize(frameWidth, frameHeight);

  return frame;
}

/** Render a built-in icon node (ShapeWithText) */
async function renderBuiltinIconNode(
  irNode: IRNode,
  existing: SceneNode | undefined,
  iconHash: string,
): Promise<ShapeWithTextNode> {
  const shape = getOrCreateNode(
    irNode.id,
    existing,
    (node): node is ShapeWithTextNode => node.type === "SHAPE_WITH_TEXT",
    () => {
      const s = figma.createShapeWithText();
      s.shapeType = "ROUNDED_RECTANGLE";
      return s;
    },
  );

  shape.name = irNode.label;
  shape.resize(BUILTIN_ICON_SIZE, BUILTIN_ICON_SIZE);

  if (shape.text) {
    await loadMediumFont();
    shape.text.characters = irNode.label;
  }

  shape.fills = [{ type: "IMAGE", imageHash: iconHash, scaleMode: "FIT" }];

  return shape;
}

/** Render a plain node without icon (ShapeWithText with solid fill) */
async function renderPlainNode(
  irNode: IRNode,
  existing: SceneNode | undefined,
  style: NodeStyle,
  w: number,
  h: number,
): Promise<ShapeWithTextNode> {
  const shape = getOrCreateNode(
    irNode.id,
    existing,
    (node): node is ShapeWithTextNode => node.type === "SHAPE_WITH_TEXT",
    () => {
      const s = figma.createShapeWithText();
      s.shapeType = "ROUNDED_RECTANGLE";
      return s;
    },
  );

  shape.name = irNode.label;
  shape.resize(w, h);
  shape.fills = [{ type: "SOLID", color: style.fill }];
  shape.strokes = [{ type: "SOLID", color: style.stroke }];
  shape.strokeWeight = style.strokeWeight;

  if (shape.text) {
    await loadMediumFont();
    shape.text.characters = irNode.label;
    shape.text.fontSize = PLAIN_NODE_FONT_SIZE;
  }

  return shape;
}

// =============================================================================
// Main Render Function
// =============================================================================

/** Resolve which component to use for a node (if any) */
async function resolveComponent(
  irNode: IRNode,
  hasCustomIcon: boolean,
): Promise<ComponentNode | null> {
  if (hasCustomIcon) {
    return null;
  }

  let componentKey: string | null = null;
  try {
    componentKey = getComponentKey(irNode.provider, irNode.kind);
  } catch {
    // Component key not found for this kind
  }

  return componentKey ? getOrImportComponent(componentKey) : null;
}

/** Create or update a node */
export async function renderNode(irNode: IRNode): Promise<SceneNode> {
  const existing = nodeIndex.get(irNode.id);
  const style = getNodeStyle(irNode.kind);

  const w = irNode.layout.w ?? style.defaultW;
  const h = irNode.layout.h ?? style.defaultH;

  let node: SceneNode;

  if (style.isSection) {
    // Section nodes (VPC/Subnet)
    node = renderSectionNode(irNode, existing, w, h);
  } else {
    // Resource nodes - determine render strategy
    const hasCustomIcon = getReceivedIcon(irNode.provider, irNode.kind) !== null;
    const component = await resolveComponent(irNode, hasCustomIcon);

    if (component) {
      node = await renderComponentNode(irNode, existing, component);
    } else {
      const iconHash = await getIconImageHash(irNode.provider, irNode.kind);

      if (iconHash) {
        node = hasCustomIcon
          ? await renderCustomIconNode(irNode, existing, iconHash)
          : await renderBuiltinIconNode(irNode, existing, iconHash);
      } else {
        node = await renderPlainNode(irNode, existing, style, w, h);
      }
    }
  }

  // Place node in correct parent
  const parentNode = irNode.parent ? nodeIndex.get(irNode.parent) : null;
  const parent = parentNode && "appendChild" in parentNode ? parentNode : getDocRoot();

  if (parent && "appendChild" in parent && node.parent !== parent) {
    parent.appendChild(node);
  }

  // Set position after appendChild to ensure coordinates are relative to parent
  node.x = irNode.layout.x;
  node.y = irNode.layout.y;

  return node;
}
