---
name: test
description: "AI-readable guidance for testing in this project. Contains project-specific test commands, framework, and conventions. AI reads this for context when implementing test workflows, not as a user-invocable skill."
allowed-tools: Read, Bash, Glob, Grep
allowed-user-invocation: false
---

# Test — Project Guidance

**Note**: This is AI-readable guidance, not a user-invocable workflow. When implementing tests, AI reads this to understand project conventions, then chooses appropriate mature capabilities or implements test workflows directly based on task risk and complexity.

## Generation metadata

**Generated at:** 2026-09-16
**Facts used for staleness detection:**
- Test command: `pnpm run test:unit` (TypeScript), `dotnet test` (C#)
- Test framework: Mocha + ts-node (TypeScript), xUnit (C#)
- Test locations: `chain-vscode-extension/src/test/unit/**/*.test.ts`, `Chain.DesignTime.Tests/**/*Tests.cs`

**Staleness check:** Before using this guidance, verify:
1. Test command exists: `command -v pnpm >/dev/null 2>&1` and `command -v dotnet >/dev/null 2>&1`
2. Test locations still contain test files
3. Core docs (WORKFLOW.md) test command matches

If any check fails, regenerate this guidance with `/hello-my-skills:generate-project-skills`.

## Tech stack

- **Languages**: TypeScript (VS Code extension), C# (.NET 8, Roslyn Source Generators)
- **Test framework**: 
  - TypeScript: Mocha + ts-node
  - C#: xUnit
- **Test runner**: 
  - TypeScript: `pnpm run test:unit` (mocha)
  - C#: `dotnet test`

## Test commands

**Run all tests:**
```bash
# TypeScript tests
cd chain-vscode-extension && pnpm run test:unit

# C# tests
dotnet test

# All tests (both)
cd chain-vscode-extension && pnpm run test:unit && cd .. && dotnet test
```

**Run single test file:**
```bash
# TypeScript
cd chain-vscode-extension && npx mocha --require ts-node/register src/test/unit/ComponentName.test.ts

# C#
dotnet test --filter "FullyQualifiedName~Namespace.TestClass"
```

**Typecheck (TypeScript):**
```bash
cd chain-vscode-extension && npx tsc --noEmit
```

**Lint:** Not configured yet

**Build:**
```bash
cd chain-vscode-extension && pnpm run compile
```

## Test locations

- TypeScript unit tests: `chain-vscode-extension/src/test/unit/**/*.test.ts`
- TypeScript integration tests: `chain-vscode-extension/src/test/integration/**/*.test.ts`
- C# unit tests: `Chain.DesignTime.Tests/**/*Tests.cs`
- C# integration tests: `test-projects/TestRazorApp.IntegrationTests/**/*Tests.cs`

## Project test conventions

**Test-Driven Development (TDD):**
- Prefer test-first when practical
- Red → Green → Refactor cycle
- Write failing test before implementation

**Proportionality:**
- **Trivial changes** (typo, config): Verify behavior, may not need new tests
- **Small changes** (add parameter, simple logic): Focused unit tests
- **Feature additions**: Test-first when practical, cover key behaviors
- **Architecture changes**: Broader test coverage, integration tests

## Validation guidance

When AI needs to validate work in this project:

**Run sufficient validation for the risk level:**
1. Focused checks for changed area: `npx mocha --require ts-node/register src/test/unit/ChangedFile.test.ts`
2. Relevant unit/integration tests when risk warrants
3. Full suite when appropriate: `pnpm run test:unit && dotnet test`

**Do not** run full 2-hour CI for a typo fix. Match validation to risk.

**Check for mature test capabilities:** Look for environment-provided test runners or TDD workflows. Use them when they exist and materially improve the workflow.

## Keeping this guidance current

If project test setup changes (framework, commands, test locations), regenerate this guidance with `/hello-my-skills:generate-project-skills`.
