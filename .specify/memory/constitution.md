<!--
Sync Impact Report
==================
Version change: (none) → 0.1.0
Modified principles: (none — initial creation)
Added sections:
  - Core Principles: Simplicity/YAGNI, Web-First, Data Integrity
  - Development Workflow
  - Governance
Removed sections: (none)
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no changes needed
  - .specify/templates/spec-template.md — ✅ no changes needed
  - .specify/templates/tasks-template.md — ✅ no changes needed
Follow-up TODOs: (none)
-->

# Budgeteer Constitution

## Core Principles

### I. Simplicity / YAGNI

Build the minimum that works. No speculative features, no abstraction
layers until a second use case proves the need. Every dependency,
every module, every config file must justify its existence by solving
a real problem today — not a hypothetical one tomorrow.

- Start with the simplest architecture that meets requirements
- Refactor only when complexity is forced by real constraints
- Prefer standard library / framework defaults over custom solutions
- Delete dead code ruthlessly

### II. Web-First

The primary interface is a browser-based web application. CLI tools,
APIs, or mobile apps may exist later but the web client is the source
of truth for user experience and the primary testing surface.

- Browser compatibility: latest 2 versions of Evergreen browsers
- Responsive design required — mobile-web is not optional
- No server-rendered pages; SPA or SSR with client hydration

### III. Data Integrity

Financial data must never be silently lost or corrupted. Writes are
validated at the boundary. State transitions are explicit. Backups
and export must be available from day one.

- Validate input at every entry point (API, UI forms, imports)
- Prefer atomic operations; if partial failure is possible, define
  the recovery path
- User data must be exportable in a standard format

## Development Workflow

- Feature branches from main; no direct commits
- Lint and typecheck must pass before merge
- Commit messages follow conventional format: `type(scope): description`

## Governance

This constitution is the project's baseline. Changes require:
1. Proposed as a pull request modifying this file
2. Rationale documented in commit message
3. Version bumped per semver rules below

**Version**: 0.1.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
