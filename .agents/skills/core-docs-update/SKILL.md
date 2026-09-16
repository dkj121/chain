---
name: core-docs-update
description: "AI-readable guidance for core documentation updates in this project. Contains project-specific doc locations, update triggers, and conventions. AI reads this for context when implementing doc update workflows, not as a user-invocable skill."
allowed-tools: Read, Bash, Glob, Grep
allowed-user-invocation: false
---

# Core Docs Update — Project Guidance

**Note**: This is AI-readable guidance, not a user-invocable workflow. When updating documentation, AI reads this to understand which docs exist, when they need updates, and project tone, then chooses appropriate mature capabilities or implements doc update workflows directly based on task risk and complexity.

## Generation metadata

**Generated at:** 2026-09-16
**Facts used for staleness detection:**
- Core docs location: `.scratch/` (ARCHITECTURE.md, SPEC.md, WORKFLOW.md)
- Additional docs: CLAUDE.md (root), README.md (root), Docs/ directory
- Update triggers: Module changes, scope changes, command changes, workflow rule changes

**Staleness check:** Before using this guidance, verify:
1. Core docs still exist at documented paths
2. Doc structure matches what's documented here
3. Update triggers are still relevant

If any check fails, regenerate this guidance with `/hello-my-skills:generate-project-skills`.

## Core documentation locations

**Architecture documentation:**
- **Primary:** `.scratch/ARCHITECTURE.md` - Module structure, data flow, component architecture, design decisions
- **When to update:** Module structure changes, new architectural patterns, significant design decisions
- **Tone:** Technical, precise, focuses on "why" decisions were made

**Requirements/Specifications:**
- **Primary:** `.scratch/SPEC.md` - Goals, scope, requirements, constraints
- **When to update:** Scope changes, new requirements, constraint updates, goal refinements
- **Tone:** Clear, specific, stakeholder-focused

**Workflow documentation:**
- **Primary:** `.scratch/WORKFLOW.md` - Build commands, test commands, deploy process, CI/CD setup
- **When to update:** Command changes, new tools, process updates, CI/CD modifications
- **Tone:** Imperative, step-by-step, focused on actions

**AI-specific guidance:**
- **Primary:** `CLAUDE.md` (root) - AI workflow rules, patterns to follow, context for AI assistants
- **When to update:** New AI workflow patterns, tool changes, context updates
- **Tone:** Directive, clear instructions for AI behavior

## Additional documentation

**Project overview:**
- `README.md` (root) - Project overview, quick start, basic usage
- Module READMEs: `chain-vscode-extension/README.md`, `Chain.DesignTime.Blazor/README.md`, etc.

**Technical documentation:**
- `Docs/` directory - In-depth guides, API documentation, examples
- `Docs/BlazorSourceGenerator.md` - Source generator implementation details

## Update triggers

**ARCHITECTURE.md needs update when:**
- New modules/projects added
- Module responsibilities change
- Data flow patterns change
- New architectural patterns introduced
- Significant design decisions made

**SPEC.md needs update when:**
- Project scope changes
- New requirements added
- Requirements clarified or refined
- Constraints change
- Goals shift

**WORKFLOW.md needs update when:**
- Build/test commands change
- New development tools introduced
- CI/CD process updates
- Deployment process changes
- Development environment setup changes

**CLAUDE.md needs update when:**
- New AI workflow rules established
- Context sections become stale
- Tool usage patterns change
- Project conventions evolve

## Proportionality guidance

**Do NOT update docs for:**
- Implementation details that don't affect architecture
- Minor refactorings that preserve behavior
- Internal code organization changes
- Routine bug fixes

**DO update docs for:**
- Public API changes
- New modules or significant components
- Workflow/process changes
- Architectural decisions
- Scope/requirement changes

## Discovery when docs move

If a core doc isn't at its expected path:

1. Search for it: `find . -name "ARCHITECTURE.md" -o -name "SPEC.md" -o -name "WORKFLOW.md"`
2. Check common alternatives: `docs/`, `documentation/`, `.docs/`, root directory
3. If not found and update is needed, create it at documented location
4. After finding/creating, regenerate this guidance to update paths

## Documentation tone and style

**General principles:**
- Technical and precise
- Matches existing documentation style
- Uses active voice
- Includes code examples where helpful
- Links to related sections

**For architecture docs:**
- Focus on "why" not just "what"
- Explain tradeoffs and alternatives considered
- Include diagrams when helpful (ASCII art acceptable)

**For workflow docs:**
- Imperative commands: "Run `npm test`" not "You can run tests"
- Include expected outputs
- Note platform-specific differences

## Keeping this guidance current

If core docs move, new docs are added, or update triggers change, regenerate this guidance with `/hello-my-skills:generate-project-skills`.
