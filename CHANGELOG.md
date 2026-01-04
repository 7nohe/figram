# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.2]: https://github.com/7nohe/figram/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/7nohe/figram/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/7nohe/figram/releases/tag/v1.0.0
