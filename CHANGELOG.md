# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Strip .yml/.yaml extensions when deriving docId for awsdac imports

## [1.1.0] - 2026-01-17

### Added

- VS Code extension with autocomplete for `provider:` and `kind:` fields, real-time YAML validation with error highlighting, and snippets for quick scaffolding
- Claude Code plugin with figram skills for development workflows

### Fixed

- VS Code init command and subnet kind validation
- Claude Code plugin installation instructions in documentation

## [1.0.2] - 2025-01-04

### Added

- Documentation site with comprehensive guides and API reference
- OG image support for social media sharing

### Changed

- Set `serve` command as the default CLI command (run `figram` without arguments)

### Fixed

- Center content before rendering edges to ensure accurate magnet calculations
- Updated site URL and OG image links to new domain

## [1.0.1] - 2025-01-03

### Fixed

- Template path resolution for bundled and development environments

## [1.0.0] - 2025-01-03

### Added

- Initial release of Figram
- YAML-driven architecture diagram DSL for FigJam
- Three-package monorepo structure:
  - `@figram/core` - Dependency-free library for DSL processing
  - `@figram/cli` - Command-line interface with `init`, `build`, and `serve` commands
  - `@figram/plugin` - FigJam plugin for live diagram rendering
- Real-time WebSocket synchronization between CLI and FigJam
- Support for AWS service icons
- Incremental updates with patch operations (`upsertNode`, `removeNode`, `upsertEdge`, `removeEdge`)
- YAML validation with descriptive error messages
- DSL to IR normalization
- Diff calculation for efficient updates

[1.1.0]: https://github.com/7nohe/figram/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/7nohe/figram/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/7nohe/figram/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/7nohe/figram/releases/tag/v1.0.0
[Unreleased]: https://github.com/7nohe/figram/compare/v1.1.0...HEAD
