---
name: clain:style-consolidation
description: Consolidate scattered inline styles and utility classes into semantic, maintainable CSS structure. Use this skill when AI generates CSS during visual editing, after multiple style changes have accumulated, when the user runs "Clain Consolidate Styles" command, or before committing changes to ensure clean, production-ready styles. Extracts repeated patterns, creates CSS classes, and refactors markup to use semantic class names.
---

# Context

**Importers/Callers:** VS Code extension command `clain.consolidateStyles`, invoked after AI editing sessions or from Command Palette. AI editing workflow in `clain-vscode-extension/src/aiEditingSession.ts` can automatically trigger this skill. Referenced in `.clain/docs/style-consolidation.md` documentation.

**Affected API:** Reads `.cshtml` files and `wwwroot/css/*.css` files. Writes updated `.cshtml` markup and consolidated CSS classes to appropriate stylesheets. Reads `design.json` for `cssArchitecture` to determine consolidation strategy. Parses inline `style=""` attributes and generates semantic CSS class definitions.

**Data Schema:** 
- Reads `.clain/design.json.cssArchitecture`: string ("tailwind" | "bootstrap" | "custom" | "none")
- Modifies `.cshtml` files: replaces inline `style=""` attributes with semantic class names
- Writes to `wwwroot/css/components.css` or project-appropriate stylesheet: new CSS class definitions
- Input: `.cshtml` files with inline styles; Output: refactored markup + extracted CSS classes

**User's instruction:** Build Claude Code skills for the five primary AI workflows: init, analyze-codebase, generate-mock-data, data-switch, and style-consolidation. Each skill should match the functional specification from the .clain/docs/ folder and enable the VS Code extension to invoke Claude for these operations.

---

# Clain Style Consolidation

Consolidate scattered inline styles and utility classes generated during AI visual editing into semantic, maintainable CSS structure following project conventions.

## What this skill does

1. Scans for inline styles in recently modified `.cshtml` files
2. Identifies repeated style patterns across components
3. Generates semantic CSS class names following project conventions
4. Extracts styles into appropriate stylesheets
5. Refactors markup to use consolidated classes
6. Validates CSS architecture compliance

## Prerequisites

- `.clain/design.json` exists with `cssArchitecture` set
- Project has editable CSS files in `wwwroot/css/`
- AI has made visual edits that may include inline styles or utility classes

## Consolidation Strategies

The consolidation approach depends on the project's CSS architecture:

### Strategy 1: Tailwind CSS Projects

**Detection:** `design.json.cssArchitecture === "tailwind"`

**Approach:**
- Preserve existing Tailwind utility classes (these are intentional)
- Extract inline styles to custom CSS classes in `wwwroot/css/components.css`
- Create semantic component classes that use `@apply` directives
- Never convert Tailwind utilities to inline styles

**Example consolidation:**
```html
<!-- Before -->
<div style="background-color: #1a202c; padding: 16px; border-radius: 8px;">
  <h2 class="text-xl font-bold text-white">Product Card</h2>
</div>

<!-- After -->
<div class="product-card">
  <h2 class="text-xl font-bold text-white">Product Card</h2>
</div>
```

**Generated CSS (components.css):**
```css
.product-card {
  @apply bg-gray-900 p-4 rounded-lg;
}
```

### Strategy 2: Bootstrap Projects

**Detection:** `design.json.cssArchitecture === "bootstrap"`

**Approach:**
- Preserve Bootstrap utility classes (`.mt-3`, `.btn-primary`, etc.)
- Extract custom inline styles to custom CSS classes
- Create component classes that extend Bootstrap base classes
- Follow BEM naming if project uses it

**Example consolidation:**
```html
<!-- Before -->
<div class="card" style="border-color: #007bff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <div class="card-body">Content</div>
</div>

<!-- After -->
<div class="card card--featured">
  <div class="card-body">Content</div>
</div>
```

**Generated CSS (site.css):**
```css
.card--featured {
  border-color: #007bff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Strategy 3: Custom CSS Projects

**Detection:** `design.json.cssArchitecture === "custom"`

**Approach:**
- Extract all inline styles to semantic classes
- Follow existing class naming convention (detect BEM, SMACSS, or custom)
- Group related styles into component classes
- Maintain project's specificity patterns

**Example consolidation:**
```html
<!-- Before -->
<div style="display: flex; gap: 16px; padding: 24px; background: #f8f9fa;">
  <div style="flex: 1; padding: 16px; border: 1px solid #dee2e6; border-radius: 8px;">
    Card content
  </div>
</div>

<!-- After -->
<div class="product-grid">
  <div class="product-grid__card">
    Card content
  </div>
</div>
```

**Generated CSS (components.css):**
```css
.product-grid {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: #f8f9fa;
}

.product-grid__card {
  flex: 1;
  padding: 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}
```

### Strategy 4: No CSS Framework

**Detection:** `design.json.cssArchitecture === "none"`

**Approach:**
- Extract all inline styles to classes
- Create simple, flat class names
- Write vanilla CSS without framework dependencies
- Keep specificity low for maintainability

## Consolidation Steps

### 1. Identify Consolidation Candidates

Scan recently modified `.cshtml` files for:
- Elements with `style=""` attributes
- Repeated inline style patterns across multiple elements
- Utility class combinations that repeat frequently (in Tailwind/Bootstrap projects)

Track modification time from git or file timestamps. Prioritize files changed in the last editing session.

### 2. Analyze Style Patterns

For each inline style found:
- Parse CSS properties and values
- Compare with other inline styles to find patterns
- Identify semantic meaning from context (element type, surrounding markup, property combinations)
- Check if similar styles already exist in project stylesheets

Group similar patterns:
```
Pattern A (5 occurrences): display: flex; gap: 16px; padding: 24px;
Pattern B (3 occurrences): border: 1px solid #dee2e6; border-radius: 8px; padding: 16px;
Pattern C (2 occurrences): color: #6c757d; font-size: 14px; font-weight: 500;
```

### 3. Generate Semantic Class Names

For each pattern, generate a semantic class name based on:
- Element role (button, card, grid, header, nav, etc.)
- Visual function (primary, secondary, highlight, muted, etc.)
- Component context (from parent elements or file name)

**Naming conventions by architecture:**
- **Tailwind**: `component-name` (e.g., `product-card`, `feature-grid`)
- **Bootstrap**: `component-name` or `component--modifier` (e.g., `card--featured`)
- **Custom (BEM)**: `block__element--modifier` (e.g., `product-grid__card--highlighted`)
- **Custom (Flat)**: `component-role` (e.g., `card-primary`, `button-large`)

### 4. Determine Target Stylesheet

Choose where to write the consolidated CSS:
- **Tailwind**: `wwwroot/css/components.css`
- **Bootstrap**: `wwwroot/css/site.css` or `wwwroot/css/custom.css`
- **Custom**: Existing component stylesheet or create `wwwroot/css/components.css`
- **None**: `wwwroot/css/styles.css` or `wwwroot/css/main.css`

If target file doesn't exist, create it and ensure it's referenced in `_Layout.cshtml`.

### 5. Extract Styles to Stylesheet

Write CSS class definitions to the target file:

```css
/* Component: Product Grid */
.product-grid {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: #f8f9fa;
}

.product-grid__card {
  flex: 1;
  padding: 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.product-grid__card--highlighted {
  border-color: #007bff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

Add descriptive comments for each component section. Group related classes together.

### 6. Refactor Markup

Update `.cshtml` files to use the new classes:

**Before:**
```html
<div style="display: flex; gap: 16px; padding: 24px; background: #f8f9fa;">
  <div style="flex: 1; padding: 16px; border: 1px solid #dee2e6; border-radius: 8px;">
    Standard card
  </div>
  <div style="flex: 1; padding: 16px; border: 1px solid #007bff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    Highlighted card
  </div>
</div>
```

**After:**
```html
<div class="product-grid">
  <div class="product-grid__card">
    Standard card
  </div>
  <div class="product-grid__card product-grid__card--highlighted">
    Highlighted card
  </div>
</div>
```

### 7. Validate Consolidation

Verify that:
- All inline styles have been extracted or documented as intentional
- Generated class names follow project conventions
- CSS is valid and properly formatted
- Markup changes preserve existing functionality
- No duplicate class definitions were created

## Completion Report

Show the user:
```
✓ Consolidated inline styles across 5 files
  - Extracted 12 unique style patterns
  - Generated 8 semantic CSS classes
  - Refactored 34 elements
✓ Updated stylesheets
  - Added classes to: wwwroot/css/components.css
  - Total CSS added: 48 lines
  
Files modified:
  - Views/Products/Index.cshtml
  - Views/Products/_ProductCard.cshtml
  - Views/Shared/_Header.cshtml
  - wwwroot/css/components.css
```

## Error Handling

- **design.json missing**: Show error suggesting to run `clain:init` first
- **cssArchitecture not set**: Ask user which architecture to assume, update design.json
- **Target stylesheet doesn't exist**: Create it, show warning about needing to reference it in _Layout.cshtml
- **Cannot parse inline styles**: Log warning with element location, skip that element
- **Class name collision**: Check if existing class has same styles; if not, generate alternative name

## Important Notes

- This skill is conservative — it only consolidates clear patterns, not one-off styles
- Single-use inline styles (occurring only once) may be left as-is or converted based on context
- The skill preserves framework utility classes (Tailwind/Bootstrap) — only custom styles are extracted
- Users can manually trigger consolidation or set it to run automatically after AI editing sessions
- Generated class names aim for semantic meaning, not generic names like `.style-1`
- Consolidation respects existing project patterns — analyzes current CSS before generating new classes
- For production builds, recommend running this skill before committing visual changes
