---
name: clain:analyze-codebase
description: Scan ASP.NET Core project structure to discover pages, components, and design patterns. Use this skill after clain:init to populate design.json with actual project data, when project structure changes significantly, when the user runs "Clain Analyze Codebase" command, or before AI component generation to understand existing patterns. Detects CSS architecture, extracts design tokens, and cross-references component dependencies.
---

# Clain Codebase Analysis

Scan an ASP.NET Core project to discover its structure, detect design patterns, and populate the design index with pages, components, and design tokens.

## What this skill does

1. Scans for Razor pages and views
2. Discovers reusable components (partials, view components)
3. Cross-references component dependencies
4. Detects CSS architecture (Tailwind, Bootstrap, custom, none)
5. Extracts design tokens from stylesheets
6. Updates `.clain/design.json` with findings

## Prerequisites

- `.clain/` directory structure exists (run `clain:init` first)
- Open workspace containing ASP.NET Core project
- Project has `Views/` directory (MVC) or `Pages/` directory (Razor Pages)

## Analysis Steps

### 1. Scan for Pages

Search for Razor pages and views:
- `Pages/**/*.cshtml` (Razor Pages projects)
- `Views/**/*.cshtml` (MVC projects)
- Exclude: `Views/Shared/`, `Views/_ViewImports.cshtml`, `Views/_ViewStart.cshtml`

For each page found, extract:
```json
{
  "route": "/products",
  "file": "Views/Products/Index.cshtml",
  "layout": "_Layout.cshtml",
  "dependencies": []
}
```

**Route inference rules:**
- `Views/Home/Index.cshtml` → `/`
- `Views/Products/Index.cshtml` → `/products`
- `Views/Products/Details.cshtml` → `/products/details`
- `Pages/Products/Index.cshtml` → `/products` (Razor Pages convention)

### 2. Scan for Components

Search for reusable components:
- `Views/Shared/*.cshtml` (Partial views)
- `Views/Shared/Components/**/*.cshtml` (View Components)
- `Views/Components/**/*.cshtml` (Alternative location)

For each component found, extract:
```json
{
  "name": "_ProductCard",
  "file": "Views/Shared/_ProductCard.cshtml",
  "type": "partial",
  "usedBy": []
}
```

Component types: `"partial"`, `"viewcomponent"`, `"taghelper"`

### 3. Cross-Reference Dependencies

For each page, search its content for component references:
- `@Html.Partial("_ComponentName")`
- `<partial name="_ComponentName" />`
- `@await Component.InvokeAsync("ComponentName")`
- `@await Html.RenderPartialAsync("_ComponentName")`

Update:
- Page's `dependencies` array with component names
- Component's `usedBy` array with page routes

This creates a bidirectional dependency graph for navigation.

### 4. Detect CSS Architecture

Check for these patterns in order of specificity:

**Tailwind CSS:**
- `tailwind.config.js` or `tailwind.config.ts` exists
- `package.json` contains `"tailwindcss"` dependency
- CSS files contain `@tailwind` directives

**Bootstrap:**
- `package.json` contains `"bootstrap"` dependency
- `_Layout.cshtml` references `bootstrap.min.css`
- Classes follow Bootstrap naming (`.btn-*`, `.container-*`, `.row`, `.col-*`)

**Custom CSS:**
- Project has `wwwroot/css/` directory with custom stylesheets
- No Tailwind or Bootstrap detected

**None:**
- No CSS files found in `wwwroot/css/`

Set `design.json.cssArchitecture` to the detected value. This informs the style consolidation strategy.

### 5. Extract Design Tokens

Analyze the main stylesheet (typically `wwwroot/css/site.css` or `wwwroot/css/main.css`):

**Colors:**
- Extract CSS variables: `:root { --primary-color: #007bff; }`
- Extract frequently used hex/rgb values in `color`, `background-color`, `border-color` properties
- Group by usage context (backgrounds, text, borders)

**Typography:**
- Extract `font-family` declarations
- Common `font-size` values (base, headings, small text)
- `font-weight` patterns (normal, bold, specific weights)
- `line-height` conventions

**Spacing:**
- Common `margin` and `padding` values
- Identify if following a scale (e.g., 4px, 8px, 16px, 24px, 32px)
- Gap values in flexbox/grid layouts

**Borders:**
- `border-radius` values used throughout
- Common border styles and widths
- Box shadow patterns

Store extracted tokens in `design.json.designTokens`:
```json
{
  "colors": {
    "primary": "#007bff",
    "secondary": "#6c757d",
    "background": "#ffffff",
    "text": "#212529",
    "border": "#dee2e6"
  },
  "typography": {
    "baseFontSize": "16px",
    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
    "headingWeights": [600, 700],
    "lineHeight": 1.5
  },
  "spacing": {
    "scale": [4, 8, 16, 24, 32, 48, 64],
    "unit": "px"
  },
  "borders": {
    "radius": [0, 4, 8, 16],
    "defaultWidth": "1px",
    "defaultStyle": "solid"
  }
}
```

### 6. Update design.json

Write complete structure to `.clain/design.json`:

```json
{
  "meta": {
    "version": "1.0",
    "projectName": "MyApp",
    "lastUpdated": "2026-09-11T15:00:00Z"
  },
  "pages": [
    {
      "route": "/",
      "file": "Views/Home/Index.cshtml",
      "layout": "_Layout.cshtml",
      "dependencies": ["_Header", "_ProductCard"]
    },
    {
      "route": "/products",
      "file": "Views/Products/Index.cshtml",
      "layout": "_Layout.cshtml",
      "dependencies": ["_ProductCard", "_Pagination"]
    }
  ],
  "components": [
    {
      "name": "_ProductCard",
      "file": "Views/Shared/_ProductCard.cshtml",
      "type": "partial",
      "usedBy": ["/", "/products"]
    },
    {
      "name": "_Header",
      "file": "Views/Shared/_Header.cshtml",
      "type": "partial",
      "usedBy": ["/"]
    }
  ],
  "designTokens": {
    "colors": { "primary": "#007bff", "secondary": "#6c757d" },
    "typography": { "baseFontSize": "16px", "fontFamily": "system-ui" },
    "spacing": { "scale": [4, 8, 16, 24, 32], "unit": "px" },
    "borders": { "radius": [0, 4, 8], "defaultWidth": "1px" }
  },
  "cssArchitecture": "bootstrap",
  "constraints": []
}
```

**Important:** Preserve existing `meta.version`, manually-set `cssArchitecture`, and `constraints` from previous runs. Only update `pages`, `components`, and `designTokens`.

### 7. Optionally Update DESIGN.md

If `DESIGN.md` exists and doesn't already have a "Discovered Patterns" section, optionally append:

```markdown
## Discovered Patterns

Analysis completed on 2026-09-11:
- **Pages**: 12 pages found across 3 areas
- **Components**: 8 reusable components (7 partials, 1 view component)
- **CSS Architecture**: Bootstrap 5
- **Design Tokens**: Extracted color palette, typography scale, and spacing system
```

Only update if the file exists. Don't overwrite user-written content.

## Completion Report

Show the user:
```
✓ Scanned project structure
  - Found 12 pages
  - Found 8 components
  - Detected CSS architecture: Bootstrap
✓ Updated design.json
  - Extracted 15 design tokens
  - Cross-referenced 24 component dependencies

Next steps:
- Review design.json for accuracy
- Run "Clain: Generate Mock Data" for design-time preview
- Run "Clain: Start Preview" to begin visual editing
```

## Error Handling

- **No Views/ or Pages/ directory**: Show error confirming this is an ASP.NET Core MVC/Razor Pages project
- **design.json doesn't exist**: Show error asking user to run `clain:init` first
- **Invalid design.json**: Back up existing file to `design.json.backup`, create new one, warn user
- **No CSS files found**: Set `cssArchitecture: "none"`, continue with rest of analysis
- **Cannot parse .cshtml**: Log warning with file path, skip that file, continue analysis

## Important Notes

- Analysis is idempotent. Re-running updates existing data without losing manual edits to `constraints` or manually-set `cssArchitecture`.
- Large projects (100+ pages) may take several seconds. Show progress for files being scanned.
- Design token extraction is best-effort. Users can manually refine values in design.json.
- This skill only reads files — it never modifies any `.cshtml`, `.css`, or source code files.
- The dependency graph helps AI understand which components are safe to modify without breaking pages.
