---
allowed-tools: Bash(bun run build), Bash(bun run check), Bash(bun run check:fix), Bash(bun run typecheck), Bash(bun test)
description: Run all CI checks locally (build, lint, typecheck, test)
argument-hint: [--fix]
---

Run the full CI pipeline locally to catch issues before pushing.

## CI Steps (matching .github/workflows/ci.yml)

1. Build: `bun run build`
2. Lint: `bun run check`
3. Type check: `bun run typecheck`
4. Test: `bun test`

## Instructions

$ARGUMENTS

If the argument is `--fix`:
1. Run `bun run check:fix` to auto-fix lint/format issues
2. Run `bun run build`
3. Run `bun run check`
4. Run `bun run typecheck`
5. Run `bun test`

Otherwise (no arguments):
1. Run `bun run build`
2. Run `bun run check`
3. Run `bun run typecheck`
4. Run `bun test`

Run all steps sequentially. If any step fails, continue with remaining steps to show all issues.

After completion, provide a summary:
- List passed checks
- List failed checks with error details
- Suggest fixes for any failures
