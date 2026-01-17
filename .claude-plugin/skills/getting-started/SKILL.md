---
name: getting-started
description: General usage guide for Figram. Use when setting up Figram, connecting to FigJam plugin, or troubleshooting connection issues.
---

# Figram Getting Started

## Documentation

- [Quick Start](https://figram.7nohe.dev/en/quick-start/) - 5-minute setup guide
- [Installation](https://figram.7nohe.dev/en/installation/) - Full installation reference
- [YAML Specs](https://figram.7nohe.dev/en/yaml-specs/) - DSL specification

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ (or [Bun](https://bun.sh/))
- [Figma Desktop](https://www.figma.com/downloads/) (web version not supported)

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE         2. SERVE           3. CONNECT                │
│                                                                 │
│  npx figram init   npx figram         FigJam Plugin             │
│       │            diagram.yaml            │                    │
│       ▼                 │                  ▼                    │
│  diagram.yaml      WebSocket ◄────► Enter docId + URL           │
│                    Server              Click Connect            │
│                                                                 │
│  4. EDIT & SYNC                                                 │
│                                                                 │
│  Edit YAML ──► Auto-sync ──► FigJam Canvas Updated              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Install CLI

**Global install:**
```bash
npm install -g figram
```

**Or use npx (no install):**
```bash
npx figram <command>
```

---

## Step 2: Create Diagram

```bash
npx figram init
```

Creates `diagram.yaml` template:

```yaml
version: 1
docId: "my-architecture"
title: "My Architecture Diagram"

nodes:
  - id: vpc
    provider: aws
    kind: network.vpc
    label: "VPC 10.0.0.0/16"
    layout: { x: 0, y: 0, w: 800, h: 500 }

  - id: alb
    provider: aws
    kind: compute.lb.alb
    label: "ALB"
    parent: vpc

edges:
  - id: alb_to_ecs
    from: alb
    to: ecs
    label: "HTTP:80"
```

---

## Step 3: Start WebSocket Server

```bash
npx figram diagram.yaml
```

Output:
```
WebSocket server started on ws://127.0.0.1:3456
Watching diagram.yaml for changes...
```

**CLI Options:**

| Option | Description | Example |
|--------|-------------|---------|
| `-p, --port` | Custom port | `npx figram diagram.yaml -p 8080` |
| `--allow-remote` | Allow remote connections | For team sharing |
| `--secret` | Require authentication | `--secret my-token` |
| `--icons` | Custom icons file | `--icons figram-icons.yaml` |
| `--no-watch` | Disable file watching | For one-time sync |

---

## Step 4: Install FigJam Plugin

1. **Install from Figma Community:**
   - Open [Figram Plugin](https://www.figma.com/community/plugin/1588833479203267078/figram)
   - Click **"Open in..."** and select Figma Desktop

2. **Or import manually (development):**
   - Figma Desktop → Plugins → Development → Import plugin from manifest
   - Select `packages/plugin/manifest.json`

---

## Step 5: Connect Plugin to CLI

1. Open **FigJam** file in Figma Desktop
2. Run **Figram plugin** (Plugins menu or right-click → Plugins)
3. Enter connection details:

| Field | Value | Notes |
|-------|-------|-------|
| **Doc ID** | `my-architecture` | Must match `docId` in YAML |
| **WebSocket URL** | `ws://127.0.0.1:3456` | Default CLI address |
| **Secret** | (optional) | If `--secret` was used |

4. Click **Connect**
5. Diagram appears on canvas!

---

## Step 6: Live Edit

Edit `diagram.yaml` and save → Changes sync automatically to FigJam.

**Example: Add a new node**

```yaml
  - id: rds
    provider: aws
    kind: database.rds
    label: "PostgreSQL"
    parent: vpc
```

Save file → Node appears in FigJam instantly.

---

## Plugin UI Reference

```
┌─────────────────────────────────────┐
│ Figram                              │
├─────────────────────────────────────┤
│ Doc ID:    [my-architecture      ]  │  ← Must match YAML docId
│ URL:       [ws://127.0.0.1:3456  ]  │  ← CLI server address
│ Secret:    [                     ]  │  ← Optional
│                                     │
│ [Connect]              Status: ●    │
├─────────────────────────────────────┤
│ JSON Import (optional)              │
│ ┌─────────────────────────────────┐ │
│ │ Paste JSON here...              │ │  ← For offline import
│ └─────────────────────────────────┘ │
│ [Import]                            │
├─────────────────────────────────────┤
│ Plugin: 1.0.0  CLI: 1.0.0           │
└─────────────────────────────────────┘
```

**Status indicators:**
- 🔴 Disconnected
- 🟡 Connecting...
- 🟢 Connected

---

## Remote Access (Team Sharing)

Share diagrams with team members:

**Server (your machine):**
```bash
npx figram diagram.yaml --allow-remote --secret team-token
```

**Team members:**
- URL: `ws://YOUR_IP:3456`
- Secret: `team-token`

Find your IP:
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

---

## Custom Icons (Free Plan)

FigJam Free Plan users need custom icons. Create `figram-icons.yaml`:

```yaml
version: 1
icons:
  aws:
    "compute.ec2": "./icons/ec2.png"
    "database.rds": "./icons/rds.png"
```

Download official icons:
- [AWS Icons](https://aws.amazon.com/architecture/icons/)
- [GCP Icons](https://cloud.google.com/icons)
- [Azure Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)

**Note:** SVG not supported. Use PNG, JPG, GIF, or WebP.

---

## JSON Import (Offline Mode)

Import diagrams without WebSocket connection:

1. Build JSON: `npx figram build diagram.yaml`
2. Copy contents of `diagram.json`
3. Paste into plugin's JSON Import area
4. Click **Import**

---

## Troubleshooting

### Connection Issues

| Problem | Solution |
|---------|----------|
| "Connection error" | Check CLI is running (`npx figram diagram.yaml`) |
| "Connection refused" | Verify port is not in use |
| Plugin not loading | Use Figma Desktop, not web version |
| "Secret mismatch" | Check `--secret` value matches plugin input |
| docId mismatch | Ensure plugin docId matches YAML `docId` exactly |

### Check CLI Status

```bash
# Verify server is running
curl -I http://127.0.0.1:3456
# Should show "Upgrade Required" (WebSocket endpoint)

# Check port usage
lsof -i :3456
```

### YAML Errors

```bash
# Validate YAML syntax
npx figram build diagram.yaml
```

Common errors:
- Missing `version` or `docId`
- Duplicate node/edge IDs
- Invalid parent reference
- Missing layout for top-level nodes

### Version Mismatch

If plugin shows "Version mismatch" warning:

```bash
# Update CLI
npm update -g figram

# Check versions
npx figram --version
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Create template | `npx figram init` |
| Start server | `npx figram diagram.yaml` |
| Validate YAML | `npx figram build diagram.yaml` |
| Custom port | `npx figram diagram.yaml -p 8080` |
| Remote access | `npx figram diagram.yaml --allow-remote` |
| With auth | `npx figram diagram.yaml --secret token` |
| Custom icons | `npx figram diagram.yaml --icons icons.yaml` |
