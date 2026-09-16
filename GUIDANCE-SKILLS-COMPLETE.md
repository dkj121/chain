# Guidance Skills Generation - Complete ✅

**Date:** 2026-09-15  
**Task:** Generate three AI-readable guidance skills for the Clain VS Code extension project

## Skills Generated

### 1. Test Guidance (`test`)
**Location:** `.claude/skills/test/SKILL.md` and `.agents/skills/test/SKILL.md`

**Purpose:** AI-readable guidance for testing in this project. Contains:
- Test framework: Mocha with Sinon for mocking
- Test commands: `npm test`, `mocha src/test/unit/<filename>.test.ts`
- Test locations: `src/test/unit/`, `src/test/integration/`, `src/test/suite/`
- TDD approach and proportionality guidance
- Validation guidance matching risk to test scope

**Key Features:**
- Staleness detection (checks test command and locations exist)
- Generated metadata: 2025-01-18
- Anti-patterns to avoid (implementation-coupled tests, tautological tests)

### 2. Code Review Guidance (`code-review`)
**Location:** `.claude/skills/code-review/SKILL.md` and `.agents/skills/code-review/SKILL.md`

**Purpose:** AI-readable guidance for code review in this project. Contains:
- Standards sources: tsconfig.json, SECURITY-FIX-2026-09-15.md, ISSUE-20-COMPLETE.md
- Documentation references: Architecture.md, README.md, CLAUDE.md
- Review approach: Standards axis + Spec axis
- Smell baseline (non-exhaustive code smells)
- Project-specific review checklist for Clain VS Code extension

**Key Features:**
- Staleness detection (verifies standards sources exist)
- Generated metadata: 2026-08-27
- Security focus: XSS prevention, input validation, HTML escaping
- TypeScript strict mode compliance checks
- VS Code API usage patterns

### 3. Core Docs Update Guidance (`core-docs-update`)
**Location:** `.claude/skills/core-docs-update/SKILL.md` and `.agents/skills/core-docs-update/SKILL.md`

**Purpose:** AI-readable guidance for core documentation updates. Contains:
- Core docs: ARCHITECTURE.md, SPEC.md, WORKFLOW.md
- Documentation locations: Docs/Architecture.md (exists), SPEC.md (not created), WORKFLOW.md (not created)
- Dynamic discovery approach using Glob patterns
- Update proportionality guidance

**Key Features:**
- Staleness detection (Glob searches for core docs)
- Generated metadata: 2026-09-15
- No central catalog - repository is source of truth
- Update only when implementation changes foundational contracts

## Directory Structure

```
.claude/skills/
├── test/
│   └── SKILL.md              (3,430 bytes)
├── code-review/
│   └── SKILL.md              (5,004 bytes)
└── core-docs-update/
    └── SKILL.md              (4,425 bytes)

.agents/skills/
├── test/
│   └── SKILL.md              (3,430 bytes)
├── code-review/
│   └── SKILL.md              (5,004 bytes)
└── core-docs-update/
    └── SKILL.md              (4,425 bytes)
```

## Important Notes

- **Not committed to git:** `.claude/` and `.agents/` directories are local AI configuration and should remain untracked (per user instruction)
- **Not user-invocable:** These are AI-readable guidance files, not user-invocable skills
- **Dual location:** Skills are installed in both `.claude/skills/` and `.agents/skills/` for compatibility
- **Staleness detection:** Each skill includes metadata and verification checks to detect when guidance becomes outdated

## Skills Metadata Summary

| Skill | Generated | Size | Staleness Check |
|-------|-----------|------|-----------------|
| test | 2025-01-18 | 3.4 KB | Test command + locations |
| code-review | 2026-08-27 | 5.0 KB | Standards sources exist |
| core-docs-update | 2026-09-15 | 4.4 KB | Glob for core docs |

## Next Steps

These guidance skills are now available for AI to reference when:
- Implementing test workflows (reads `test` guidance)
- Performing code reviews (reads `code-review` guidance)
- Updating core documentation (reads `core-docs-update` guidance)

Skills will automatically check for staleness before use and prompt regeneration if project structure changes.

## Verification

All six files verified present:
```bash
$ find .claude/skills .agents/skills -name "SKILL.md" -type f
.claude/skills/core-docs-update/SKILL.md
.claude/skills/test/SKILL.md
.claude/skills/code-review/SKILL.md
.agents/skills/core-docs-update/SKILL.md
.agents/skills/test/SKILL.md
.agents/skills/code-review/SKILL.md
```

**Status:** ✅ All guidance skills successfully generated and installed
