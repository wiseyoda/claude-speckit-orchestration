# UI Design: Workflow Decomposition - Design Phase

**Phase**: `1047-workflow-decomposition-design`
**Created**: 2026-01-18

## Not a Visual UI Phase

This phase implements **CLI commands** that a dashboard application can consume. The word "dashboard" in the spec refers to an external consumer of these CLI commands, not a visual UI being built in this phase.

## What This Phase Builds

- `specflow workflow design` - CLI command with JSON streaming output
- `specflow workflow answer` - CLI command to answer queued questions
- `specflow workflow status` - CLI command to check workflow state

## Visual UI Context

The dashboard that consumes these CLI commands is being built in **Phase 1050 (Workflow Runner)** and beyond. This phase only provides the CLI interface layer.

## CLI Output Format

Commands output NDJSON (newline-delimited JSON) when `--json` flag is used:

```
{"type":"phase_started","timestamp":"...","data":{"phase":"discover"}}
{"type":"artifact_created","timestamp":"...","data":{"artifact":"discovery.md"}}
{"type":"complete","timestamp":"...","data":{"exitCode":0}}
```

Human-readable output follows the Three-Line Rule from the constitution.

## No Visual Components

This phase creates no:
- Dashboard screens
- Forms or buttons
- Visual layouts
- Interactive components

All output is text-based CLI output.
