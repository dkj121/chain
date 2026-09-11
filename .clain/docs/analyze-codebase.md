# clain:analyze-codebase - Project Structure Analysis

## Purpose

Scan an ASP.NET Core project to discover pages, components, and design patterns. Populates `.clain/design.json` with project structure, detects CSS architecture, and extracts design tokens from existing stylesheets.

## When to use

- After running `clain:init` to populate design.json with actual project data
- When project structure changes significantly (new pages, components added)
- User runs "Clain: Analyze Codebase" command
- Before AI component generation to understand existing patterns

## Prerequisites

- `.clain/` directory structure exists (run `clain:init` first)
- Open workspace containing ASP.NET Core project
- Project has Views/ directory

## Steps

### 1. Scan for pages

Search for Razor pages and views:
- `Pages/**/*.cshtml` (Razor Pages projects)
- `Views/**/*.cshtml` (MVC projects)
- Exclude `Views/Shared/`, `Views/_ViewImports.cshtml`, `Views/_ViewStart.cshtml`

For each page found, extract:
```json
{
  "route": "/products",
  "file": "Views/Products/Index.cshtml",
  "layout": "_Layout.cshtml",
  "dependencies": []
}
```

Route inference rules:
- `Views/Home/Index.cshtml` → `/`
- `Views/Products/Index.cshtml` → `/products`
- `Views/Products/Details.cshtml` → `/products/details`
- `Pages/Products/Index.cshtml` → `/products` (Razor Pages)

### 2. Scan for components

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

### 3. Cross-reference dependencies

For each page, search its content for:
- `@Html.Partial("_ComponentName")` 
- `<partial name="_ComponentName" />`
- `@await Component.InvokeAsync("ComponentName")`
- `@await Html.RenderPartialAsync("_ComponentName")`

Add found component names to:
- Page's `dependencies` array
- Component's `usedBy` array (with page route)

### 4. Detect CSS architecture

Check for these patterns in order:

**Tailwind:**
- `tailwind.config.js` exists
- OR `package.json` contains `"tailwindcss"`
- OR CSS files contain `@tailwind` directives

**Bootstrap:**
- `package.json` contains `"bootstrap"`
- OR `_Layout.cshtml` references `bootstrap.min.css`
- OR CSS classes follow Bootstrap naming (`.btn-`, `.container-`, etc.)

**Custom:**
- Project has `wwwroot/css/` directory with custom stylesheets
- No Tailwind or Bootstrap detected

**None:**
- No CSS files found

Set `design.json.cssArchitecture` to detected value.

### 5. Extract design tokens

Analyze main stylesheet (typically `wwwroot/css/site.css` or `wwwroot/css/main.css`):

**Colors:**
- Extract CSS variables: `:root { --primary-color: #007bff; }`
- Extract frequently used hex/rgb values in color properties
- Group by usage (background, text, border)

**Typography:**
- Extract `font-family` declarations
- Common `font-size` values
- `font-weight` patterns

**Spacing:**
- Common margin/padding values
- Identify if following a scale (4px, 8px, 16px, etc.)

**Borders:**
- `border-radius` values used
- Common border styles

Store extracted tokens in `design.json.designTokens`:
```json
{
  "colors": {
    "primary": "#007bff",
    "secondary": "#6c757d",
    "background": "#ffffff",
    "text": "#212529"
  },
  "typography": {
    "baseFontSize": "16px",
    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
    "headingWeights": [600, 700]
  },
  "spacing": {
    "scale": [4, 8, 16, 24, 32, 48],
    "unit": "px"
  },
  "borders": {
    "radius": [0, 4, 8, 16],
    "defaultWidth": "1px"
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
    "lastUpdated": "2026-09-11T14:30:00Z"
  },
  "pages": [
    {
      "route": "/",
      "file": "Views/Home/Index.cshtml",
      "layout": "_Layout.cshtml",
      "dependencies": ["_Header", "_ProductCard"]
    }
  ],
  "components": [
    {
      "name": "_ProductCard",
      "file": "Views/Shared/_ProductCard.cshtml",
      "type": "partial",
      "usedBy": ["/", "/products"]
    }
  ],
  "designTokens": {
    "colors": { "primary": "#007bff" },
    "typography": { "baseFontSize": "16px" }
  },
  "cssArchitecture": "bootstrap",
  "constraints": []
}
```

Preserve existing `meta.version`, `cssArchitecture` (if manually set), and `constraints` from previous runs.

### 7. Update DESIGN.md

If `DESIGN.md` exists, optionally append a "## Discovered Patterns" section with:
- Count of pages and components found
- Detected CSS architecture
- Most common design tokens

Only update if file exists and doesn't already have this section. Don't overwrite user content.

## Output

Report to user:
```
✓ Scanned project structure
  - Found X pages
  - Found Y components
  - Detected CSS architecture: [framework]
✓ Updated design.json
  - Extracted Z design tokens
  - Cross-referenced dependencies

Next steps:
- Review design.json for accuracy
- Run "Clain: Start Preview" to begin visual editing
```

## Error handling

- **No Views/ directory**: Show error, confirm this is ASP.NET Core MVC/Razor Pages project
- **design.json doesn't exist**: Show error, ask user to run `clain:init` first
- **Invalid design.json**: Back up existing file, create new one, warn user
- **No CSS files found**: Set `cssArchitecture: "none"`, continue analysis

## Notes

- Analysis is idempotent. Re-running updates existing data without losing manual edits to `constraints` or manually-set `cssArchitecture`.
- Large projects (100+ pages) may take several seconds. Show progress indicator.
- Design tokens are best-effort extraction. User can manually refine in design.json.
- This skill doesn't modify any .cshtml files, only reads them.
