---
allowed-tools: Bash(git log:*), Bash(git tag:*), Bash(git describe:*), Read, Edit
description: Update CHANGELOG.md with changes since the last release
argument-hint: [version]
---

Update the CHANGELOG.md file with changes since the last release.

## Instructions

$ARGUMENTS

### If a version argument is provided (e.g., `1.0.3`):
1. Get commits since the last tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`
2. Analyze commits and categorize them into:
   - **Added**: New features (`feat:`)
   - **Changed**: Changes to existing functionality
   - **Fixed**: Bug fixes (`fix:`)
   - **Removed**: Removed features
   - **Deprecated**: Soon-to-be removed features
   - **Security**: Security fixes
3. Read the current CHANGELOG.md
4. Insert a new version section after the `## [Unreleased]` line (or at the top if no Unreleased section)
5. Use today's date in YYYY-MM-DD format
6. Update the version comparison links at the bottom

### If no version argument is provided:
1. Get commits since the last tag
2. Show a preview of what would be added
3. Ask the user what version number to use

## Commit Message Conventions

- `feat:` or `feat(scope):` → Added
- `fix:` or `fix(scope):` → Fixed
- `chore:` → Usually skip (unless significant)
- `docs:` → Added (Documentation)
- `refactor:` → Changed
- `perf:` → Changed (Performance)
- `test:` → Usually skip
- `build:` → Usually skip

## Example Output

```markdown
## [1.0.3] - 2025-01-05

### Added

- New feature description

### Fixed

- Bug fix description
```

## Notes

- Skip `chore: bump version` commits
- Group related changes together
- Write clear, user-facing descriptions (not just commit messages)
- Ensure GitHub comparison links are updated at the bottom of the file
