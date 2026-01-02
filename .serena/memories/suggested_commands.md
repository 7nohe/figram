Common commands:
- bun install
- bun run build
- bun test (or bun test --watch; bun test packages/core/)
- bun run check (lint/format)
- bun run check:fix
- bun run typecheck
- bun run packages/cli/src/index.ts <command> (init/build/serve)
- cd packages/plugin && bun run build

CI runs: build, check, typecheck, test.