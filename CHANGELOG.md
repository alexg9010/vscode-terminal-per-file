# Changelog

All notable changes to the "Terminal Per File" extension are documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.1] - 2026-09-07

### Added

- Pin a dedicated terminal to each file; switching the active editor auto-shows (or creates) that file's terminal.
- `terminalPerFile.scope` setting to pin per file or per directory.
- `Terminal Per File: Toggle Auto-Switch` command to pause/resume auto-switching.
- `Terminal Per File: Close Terminal For Current File` command.
- Optional tmux backing (`terminalPerFile.useTmux`) so long-running processes survive closing VS Code and reattach automatically, with configurable session prefix and tmux binary path.
- `terminalPerFile.includeExtensions` to only pin terminals for specific file extensions, leaving other files untouched.
- `terminalPerFile.startupCommands` to run a command (e.g. launch a REPL) the first time a terminal is created for a given file extension.
- Advanced regex-based matching: `terminalPerFile.ignorePattern` and `terminalPerFile.startupCommandRules`, documented in `docs/advanced-matching.md`.
- Status bar item showing whether auto-switch is on or paused; clicking it toggles the same as the command.
