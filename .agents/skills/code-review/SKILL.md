---
name: code-review
description: "AI-readable guidance for code review in this project. Contains project-specific standards sources, patterns, and review focus areas. AI reads this for context when implementing review workflows, not as a user-invocable skill."
allowed-tools: Read, Bash, Glob, Grep
allowed-user-invocation: false
---

# Code Review — Project Guidance

**Note**: This is AI-readable guidance, not a user-invocable workflow. When implementing code review, AI reads this to understand project standards and conventions, then chooses appropriate mature capabilities or implements review workflows directly based on task risk and complexity.

## Generation metadata

**Generated at:** 2026-09-16
**Facts used for staleness detection:**
- Standards sources: CLAUDE.md, TypeScript/VS Code conventions, C#/.NET conventions, Roslyn API patterns
- Key patterns: Source mapping, surgical changes, allowlist security, component discovery
- Review focus: Security, source mapping, VS Code API, Roslyn API

**Staleness check:** Before using this guidance, verify:
1. CLAUDE.md exists and contains architectural guidance
2. Standards sources are current
3. Project patterns documented in this file still apply

If any check fails, regenerate this guidance with `/hello-my-skills:generate-project-skills`.

## Standards sources

**Primary:**
- `CLAUDE.md` - Architecture, workflow rules, AI-specific guidance
- `.scratch/ARCHITECTURE.md` - Module structure, data flow, component architecture
- `.scratch/SPEC.md` - Goals, scope, requirements

**Language-specific:**
- TypeScript: VS Code extension best practices, VS Code API patterns
- C#: .NET conventions, ASP.NET Core patterns, Roslyn Source Generator patterns

**External:**
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [.NET Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [Roslyn API Documentation](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/)

## Chain-specific patterns

**Source Mapping:**
- Use `data-chain-src` attributes for element-to-code mapping
- Format: `data-chain-src="file.cshtml:line:char"`
- Surgical changes: precise line/character edits, not whole-file rewrites

**Security:**
- Allowlist-based component validation (no arbitrary code execution)
- Workspace boundary checks with symlink resolution (`fs.realpathSync`)
- Input validation on all webview messages
- File extension validation (.cshtml, .razor only)

**Component Discovery:**
- No hardcoded CSS rules - discover components from actual markup
- Use Roslyn semantic analysis for accurate parsing
- Respect existing project structure

**VS Code Integration:**
- Use workspace edits for file modifications
- Webview messaging for preview <-> extension communication
- Proper resource cleanup (disposables)

## Code smell baseline

Watch for these common issues:

1. **Abstraction for single caller** - Don't create interfaces/abstractions used by only one implementation
2. **Duplicated logic** - Extract to shared utilities
3. **Dead code** - Remove unused functions, parameters, variables
4. **Error swallowing** - Empty catch blocks, ignored errors
5. **Misleading names** - Names that don't match behavior
6. **Mixed abstraction levels** - High-level and low-level operations in same function

## Review focus areas

**Security (highest priority):**
- Authentication/authorization checks
- Data access validation
- Component allowlist enforcement
- Workspace boundary validation
- Input sanitization
- Path traversal prevention

**Source Mapping Correctness:**
- Accurate line/character positions
- Handles multi-line elements
- Preserves indentation
- Updates after edits

**VS Code API Usage:**
- Proper workspace edit API usage
- Webview security (CSP, message validation)
- Resource disposal (disposables registered)
- Error handling and user feedback

**Roslyn API Patterns:**
- Semantic model usage (not just syntax trees)
- Proper symbol resolution
- Incremental source generation
- Compilation context handling

## Proportionality

Match review depth to change risk:

- **Low-risk** (typo, comment, test): Quick scan, focus on correctness
- **Medium-risk** (new feature, refactor): Standard review, check patterns and tests
- **High-risk** (security, API change, data handling): Deep review, adversarial testing, multiple passes

## Keeping this guidance current

If project standards or patterns change, regenerate this guidance with `/hello-my-skills:generate-project-skills`.
