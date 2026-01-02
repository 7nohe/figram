/**
 * Debug script to extract component keys from FigJam shapes.
 *
 * Usage:
 * 1. In FigJam (paid plan), drag ALL AWS shapes from the Shapes panel
 * 2. Select all the shapes
 * 3. Run this plugin
 * 4. Copy the output to packages/plugin/src/component-keys/aws.ts
 */

// Show UI for output
figma.showUI(
  `
  <style>
    body { font-family: system-ui, sans-serif; font-size: 13px; padding: 16px; margin: 0; }
    h3 { margin: 0 0 8px 0; font-size: 14px; }
    .stats { background: #e3f2fd; padding: 8px; border-radius: 4px; margin-bottom: 12px; }
    textarea {
      width: 100%;
      height: calc(100vh - 140px);
      font-family: monospace;
      font-size: 11px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      box-sizing: border-box;
    }
    button {
      margin-top: 8px;
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover { background: #1565c0; }
  </style>
  <h3>AWS Component Keys Scanner</h3>
  <div class="stats" id="stats">Scanning...</div>
  <textarea id="output" readonly></textarea>
  <button onclick="navigator.clipboard.writeText(document.getElementById('output').value)">Copy to Clipboard</button>
  <script>
    window.onmessage = (e) => {
      const data = e.data.pluginMessage;
      document.getElementById('stats').textContent = data.stats;
      document.getElementById('output').value = data.output;
    };
  </script>
`,
  { width: 600, height: 600 },
);

interface NodeInfo {
  name: string;
  type: string;
  key?: string;
  mainComponentKey?: string;
  componentId?: string;
  pluginData?: Record<string, string>;
  sharedPluginData?: Record<string, Record<string, string>>;
  fills?: string;
  strokes?: string;
}

async function scanNode(node: SceneNode): Promise<NodeInfo> {
  const info: NodeInfo = {
    name: node.name,
    type: node.type,
  };

  // Check if it's a component instance
  if (node.type === "INSTANCE") {
    const instance = node as InstanceNode;
    try {
      const mainComponent = await instance.getMainComponentAsync();
      if (mainComponent) {
        info.componentId = mainComponent.id;
        info.mainComponentKey = mainComponent.key;
        info.key = mainComponent.key;
      }
    } catch (e) {
      info.key = `Error: ${String(e)}`;
    }
  }

  // Check if it's a component
  if (node.type === "COMPONENT") {
    const component = node as ComponentNode;
    info.key = component.key;
  }

  // Check for plugin data
  const pluginDataKeys = node.getPluginDataKeys();
  if (pluginDataKeys.length > 0) {
    info.pluginData = {};
    for (const key of pluginDataKeys) {
      info.pluginData[key] = node.getPluginData(key);
    }
  }

  // Check shared plugin data for common namespaces
  const namespaces = ["figma", "figjam", "aws", ""];
  for (const ns of namespaces) {
    try {
      const sharedKeys = node.getSharedPluginDataKeys(ns);
      if (sharedKeys.length > 0) {
        if (!info.sharedPluginData) info.sharedPluginData = {};
        info.sharedPluginData[ns || "(empty)"] = {};
        for (const key of sharedKeys) {
          info.sharedPluginData[ns || "(empty)"][key] = node.getSharedPluginData(ns, key);
        }
      }
    } catch (_e) {
      // Ignore errors for invalid namespaces
    }
  }

  // Check fills for image references
  if ("fills" in node && node.fills && Array.isArray(node.fills)) {
    const fillInfo = node.fills.map((fill: Paint) => {
      if (fill.type === "IMAGE") {
        return `IMAGE:${(fill as ImagePaint).imageHash}`;
      }
      return fill.type;
    });
    info.fills = fillInfo.join(", ");
  }

  return info;
}

async function _scanAllNodes(nodes: readonly SceneNode[]): Promise<NodeInfo[]> {
  const results: NodeInfo[] = [];

  for (const node of nodes) {
    results.push(await scanNode(node));

    // Recursively scan children
    if ("children" in node) {
      results.push(...(await _scanAllNodes(node.children)));
    }
  }

  return results;
}

interface ComponentKeyEntry {
  name: string;
  key: string;
}

async function main() {
  try {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        stats: "No selection. Please select AWS shapes first.",
        output: "",
      });
      return;
    }

    // Collect component keys from selection
    const entries: ComponentKeyEntry[] = [];

    for (const node of selection) {
      if (node.type === "INSTANCE") {
        const instance = node as InstanceNode;
        const mainComponent = await instance.getMainComponentAsync();
        if (mainComponent?.key) {
          entries.push({
            name: node.name,
            key: mainComponent.key,
          });
        }
      }
    }

    // Sort by name
    entries.sort((a, b) => a.name.localeCompare(b.name));

    // Generate TypeScript code
    const tsOutput = [
      "// AWS FigJam Component Keys",
      "// Auto-generated by debug-keys plugin",
      `// Scanned ${entries.length} components on ${new Date().toISOString().split("T")[0]}`,
      "",
      "export const AWS_COMPONENT_KEYS: Record<string, string> = {",
      ...entries.map((e) => `  // ${e.name}\n  "TODO_KIND": "${e.key}",`),
      "};",
    ];

    // Generate simple list for reference
    const listOutput = entries.map((e) => `${e.name}: ${e.key}`).join("\n");

    figma.ui.postMessage({
      stats: `Found ${entries.length} AWS component keys from ${selection.length} selected nodes`,
      output: `${tsOutput.join("\n")}\n\n// === RAW LIST ===\n// ${listOutput.replace(/\n/g, "\n// ")}`,
    });
  } catch (e) {
    figma.ui.postMessage({
      stats: `Error: ${String(e)}`,
      output: "",
    });
  }
}

main();
