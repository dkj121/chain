# clain:init - Project Initialization

## Purpose

Initialize a new ASP.NET Core project for Clain visual design tool. Sets up `.clain/` directory structure, adds `Clain.DesignTime` NuGet package, and conducts a grill-me style interview to extract the project's design philosophy and generate `DESIGN.md`.

## When to use

- User runs "Clain: Init Project" command
- New project being onboarded to Clain
- Need to establish design principles and constraints

## Prerequisites

- Open workspace containing an ASP.NET Core project (.csproj file)
- .NET SDK installed
- Write access to workspace

## Steps

### 1. Verify project structure

Check that:
- Workspace folder is open
- At least one .csproj file exists
- Project is ASP.NET Core (check `<Project Sdk="Microsoft.NET.Sdk.Web">`)

If multiple projects exist, ask user which one to initialize.

### 2. Create .clain directory structure

Create the following structure in workspace root:

```
.clain/
├── docs/           # Skill definitions (this file is one)
├── design.json     # Will be populated by analyze-codebase
├── mock-data.json  # Will be populated by generate-mock-data
├── config.json     # Extension settings
└── .gitignore      # Exclude workspace.json
```

Create `.clain/.gitignore` with:
```
workspace.json
```

Create `.clain/config.json` with default settings:
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

### 3. Add Clain.DesignTime NuGet package

Run in the selected project directory:
```bash
dotnet add package Clain.DesignTime
```

If package doesn't exist yet (MVP phase), skip and note that Tag Helper needs manual setup.

### 4. Conduct design philosophy interview

Use grill-me questioning style to extract:

**Design Philosophy:**
- What is the visual language? (minimalist, bold, playful, corporate, etc.)
- What are the primary brand colors?
- Typography choices? (serif/sans-serif, font families)
- Spacing system? (tight/generous, specific scales)
- Border radius preference? (sharp/rounded)
- Shadow usage? (flat/subtle/pronounced)

**Component Strategy:**
- Prefer composition or specialized components?
- Naming conventions? (PascalCase, kebab-case)
- Component organization? (by feature, by type, flat)
- Shared components location? (`Views/Shared/`, custom path)

**CSS Architecture:**
- Framework in use? (Tailwind, Bootstrap, custom, none)
- Utility-first or semantic classes?
- CSS file organization?
- Class naming convention? (BEM, SMACSS, custom)

**Constraints:**
- Must maintain accessibility? (WCAG level)
- Browser support targets?
- Performance constraints? (bundle size, render time)
- Style restrictions? (no inline styles in production, etc.)

Ask 2-3 questions at a time. Let answers guide follow-ups. Don't ask everything if answers are implicit.

### 5. Generate DESIGN.md

Create `/DESIGN.md` (workspace root, not inside .clain/) with sections:

```markdown
# Design Philosophy

[2-3 paragraphs capturing visual language, brand identity, and design principles]

## Visual Language

- **Color Palette**: [Primary, secondary, accent colors with hex codes]
- **Typography**: [Font families, sizes, weights used]
- **Spacing**: [Scale or system description]
- **Borders & Radius**: [Approach to borders and corner rounding]
- **Shadows**: [Shadow usage philosophy]

## Component Strategy

[1-2 paragraphs on component philosophy]

- **Composition**: [Prefer composition or specialized components]
- **Naming**: [Convention used]
- **Organization**: [File structure approach]
- **Shared Location**: [Path to shared components]

## CSS Architecture

- **Framework**: [Tailwind/Bootstrap/Custom/None]
- **Approach**: [Utility-first/Semantic/Hybrid]
- **Organization**: [How CSS files are structured]
- **Class Naming**: [BEM/SMACSS/Custom convention]

## Constraints

- **Accessibility**: [WCAG level or none]
- **Browser Support**: [Targets]
- **Performance**: [Key metrics]
- **Style Rules**: [e.g., "No inline styles in production"]

## Notes

[Any additional context that doesn't fit above categories]
```

Focus on **high-level principles**, not component catalogs. The goal is design philosophy as input to AI decisions, not documentation of existing components.

### 6. Create initial design.json

Create `.clain/design.json` with metadata structure (empty data):

```json
{
  "meta": {
    "version": "1.0",
    "projectName": "[Extracted from .csproj]",
    "lastUpdated": "[ISO timestamp]"
  },
  "pages": [],
  "components": [],
  "designTokens": {},
  "cssArchitecture": "[From interview or 'unknown']",
  "constraints": []
}
```

Populate `cssArchitecture` and `constraints` from interview answers. Leave `pages` and `components` empty (will be filled by `clain:analyze-codebase`).

### 7. Verify setup

Check that:
- `.clain/` directory exists with all subdirectories
- `DESIGN.md` exists at workspace root
- `.clain/design.json` has valid JSON structure
- `.clain/config.json` exists
- NuGet package added (or noted if skipped)

## Output

Report to user:
```
✓ Created .clain/ directory structure
✓ Added Clain.DesignTime NuGet package
✓ Generated DESIGN.md
✓ Created design.json

Next steps:
- Run "Clain: Analyze Codebase" to scan existing components
- Run "Clain: Start Preview" to begin visual editing
```

## Error handling

- **No .csproj found**: Show error, ask user to open ASP.NET Core project
- **Multiple projects**: Show QuickPick to select one
- **Permission denied**: Show error with path that failed
- **Interview interrupted**: Save partial DESIGN.md with note at top: "<!-- Incomplete - resume with clain:init -->"

## Notes

- DESIGN.md is human-editable. AI reads it for context but never overwrites without confirmation.
- design.json is machine-managed. Prefer editing source files over manual JSON edits.
- This skill runs once per project. Re-running updates existing files with confirmation.
