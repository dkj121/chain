---
name: clain:init
description: Initialize a new ASP.NET Core project for Clain visual design tool. Use this skill when the user runs "Clain Init Project" command, wants to set up Clain for a new project, or needs to establish design principles and constraints for an ASP.NET Core application. Creates .clain/ structure, adds Clain.DesignTime NuGet package, conducts design philosophy interview, and generates DESIGN.md.
---

# Clain Project Initialization

Initialize an ASP.NET Core project for Clain, establishing the design philosophy and project structure needed for AI-driven visual editing.

## What this skill does

1. Verifies ASP.NET Core project structure
2. Creates `.clain/` directory with configuration files
3. Adds `Clain.DesignTime` NuGet package for source mapping
4. Conducts design philosophy interview (grill-me style)
5. Generates `DESIGN.md` with project design principles
6. Creates initial `design.json` structure

## Prerequisites

- Open workspace containing an ASP.NET Core project (`.csproj` file exists)
- .NET SDK installed
- Write access to workspace

## Initialization Steps

### 1. Verify Project Structure

Check that the workspace contains a valid ASP.NET Core project:
- At least one `.csproj` file exists
- Project is ASP.NET Core: `<Project Sdk="Microsoft.NET.Sdk.Web">`

If multiple projects exist, ask user which one to initialize for Clain.

### 2. Create Directory Structure

Create `.clain/` in the workspace root:

```
.clain/
├── docs/           # Skill definitions
├── design.json     # Project structure index (populated by analyze-codebase)
├── mock-data.json  # Mock ViewModels (populated by generate-mock-data)
├── config.json     # Extension settings
└── .gitignore      # Exclude workspace.json
```

**Create `.clain/.gitignore`:**
```
workspace.json
```

**Create `.clain/config.json`:**
```json
{
  "version": "1.0",
  "kestrel": {
    "port": 5000,
    "environment": "Development"
  },
  "preview": {
    "autoRefresh": true,
    "hotReload": true
  }
}
```

### 3. Add NuGet Package

Run in the selected project directory:
```bash
dotnet add package Clain.DesignTime
```

If the package doesn't exist yet (MVP phase), skip this step and note that the Tag Helper requires manual setup.

### 4. Conduct Design Philosophy Interview

Use a grill-me questioning style to understand the project's design approach. Ask 2-3 questions at a time, letting answers guide follow-ups. Don't ask everything if answers are implicit.

**Design Philosophy:**
- What is the visual language? (minimalist, bold, playful, corporate, etc.)
- Primary brand colors?
- Typography choices? (serif/sans-serif, font families)
- Spacing system? (tight/generous, specific scales like 4px/8px/16px)
- Border radius preference? (sharp corners vs rounded)
- Shadow usage? (flat design, subtle shadows, pronounced depth)

**Component Strategy:**
- Prefer composition (combining small pieces) or specialized components?
- Naming conventions? (PascalCase like `_ProductCard`, kebab-case)
- Component organization? (by feature, by type, flat structure)
- Where are shared components stored? (`Views/Shared/`, custom path)

**CSS Architecture:**
- Framework in use? (Tailwind CSS, Bootstrap, custom CSS, none)
- Utility-first approach or semantic class names?
- How are CSS files organized?
- Class naming convention? (BEM, SMACSS, custom)

**Constraints:**
- Accessibility requirements? (WCAG 2.1 Level AA, etc.)
- Browser support targets? (modern browsers, IE11, etc.)
- Performance constraints? (bundle size limits, render time targets)
- Style restrictions? (e.g., "No inline styles in production code")

### 5. Generate DESIGN.md

Create `DESIGN.md` in the workspace root (not inside `.clain/`):

```markdown
# Design Philosophy

[2-3 paragraphs capturing the project's visual language, brand identity, and design principles extracted from the interview]

## Visual Language

- **Color Palette**: [Primary, secondary, accent colors with hex codes]
- **Typography**: [Font families, sizes, weights used in the project]
- **Spacing**: [Spacing scale or system description]
- **Borders & Radius**: [Approach to borders and corner rounding]
- **Shadows**: [Shadow usage philosophy and values]

## Component Strategy

[1-2 paragraphs explaining the component philosophy]

- **Composition**: [Prefer composition or specialized components]
- **Naming**: [Convention used for component names]
- **Organization**: [File structure approach]
- **Shared Location**: [Path to shared components]

## CSS Architecture

- **Framework**: [Tailwind/Bootstrap/Custom/None]
- **Approach**: [Utility-first/Semantic classes/Hybrid]
- **Organization**: [How CSS files are structured]
- **Class Naming**: [BEM/SMACSS/Custom convention]

## Constraints

- **Accessibility**: [WCAG level or requirements]
- **Browser Support**: [Target browsers and versions]
- **Performance**: [Key metrics and limits]
- **Style Rules**: [e.g., "No inline styles in production", "All buttons must use .btn base class"]

## Notes

[Any additional context or project-specific considerations]
```

**Important:** Focus on high-level design principles, not component catalogs. This document provides context for AI decision-making during visual editing.

### 6. Create Initial design.json

Create `.clain/design.json` with metadata structure:

```json
{
  "meta": {
    "version": "1.0",
    "projectName": "[Extract from .csproj AssemblyName]",
    "lastUpdated": "[Current ISO 8601 timestamp]"
  },
  "pages": [],
  "components": [],
  "designTokens": {},
  "cssArchitecture": "[From interview: 'tailwind'/'bootstrap'/'custom'/'none']",
  "constraints": ["[Constraints extracted from interview]"]
}
```

Populate `cssArchitecture` and `constraints` arrays from the interview answers. Leave `pages`, `components`, and `designTokens` empty — they'll be filled by the `clain:analyze-codebase` skill.

### 7. Verify Setup

Confirm that:
- `.clain/` directory exists with all required files
- `DESIGN.md` exists at workspace root
- `.clain/design.json` contains valid JSON
- `.clain/config.json` exists with valid settings
- NuGet package was added (or skipped with note)

## Completion Report

Show the user:
```
✓ Created .clain/ directory structure
✓ Added Clain.DesignTime NuGet package
✓ Generated DESIGN.md with design philosophy
✓ Created design.json with project metadata

Next steps:
- Run "Clain: Analyze Codebase" to scan existing components
- Run "Clain: Start Preview" to begin visual editing
```

## Error Handling

- **No .csproj found**: Show error message asking user to open an ASP.NET Core project workspace
- **Multiple projects**: Display VS Code QuickPick to let user select which project to initialize
- **Permission denied**: Show error with the specific path that failed
- **Interview interrupted**: Save partial `DESIGN.md` with note at top: `<!-- Incomplete - resume with clain:init -->`
- **NuGet package not found**: Skip package installation and inform user that Tag Helper setup is manual for now

## Important Notes

- `DESIGN.md` is human-editable. AI reads it for context but never overwrites without user confirmation.
- `design.json` is machine-managed. Users should edit source files rather than manually editing this JSON.
- This skill should run once per project. Re-running updates existing files with user confirmation.
- The `.clain/docs/` directory is created empty — skill definitions live in `.claude/skills/clain/` instead.
