# clain:style-consolidation - Style Consolidation & Refactoring

## Purpose

Analyze inline `style=""` attributes accumulated during visual editing, intelligently group similar styles, and suggest CSS refactoring strategies based on the project's CSS architecture. Prevents style bloat while maintaining code quality.

## When to use

- After visual editing session with many inline style changes
- User runs "Clain: Consolidate Styles" command
- Before committing changes to ensure clean CSS
- When inline styles accumulate and need organization

## Prerequisites

- `.clain/design.json` exists with detected `cssArchitecture`
- Project has modified .cshtml files with inline styles
- Git working directory (to show diffs)

## Steps

### 1. Scan for inline styles

Search all .cshtml files for inline `style=""` attributes:
- Track file path, line number, element type
- Extract style declarations (e.g., `margin: 10px; color: #333;`)
- Group by file and by similarity

Example findings:
```
Views/Products/Index.cshtml:15
  <div style="margin: 16px; padding: 16px; border-radius: 8px;">

Views/Products/Index.cshtml:23
  <div style="margin: 16px; padding: 16px; border-radius: 8px;">

Views/Home/Index.cshtml:42
  <button style="background-color: #007bff; color: white; padding: 8px 16px;">
```

### 2. Analyze style patterns

Group similar inline styles:
- Exact duplicates → prime candidates for extraction
- Similar with variations → consider parameterized class
- One-off unique styles → may stay inline

Count occurrences:
- 3+ identical → strong extraction candidate
- 2 identical → moderate candidate
- 1 unique → low priority

### 3. Detect CSS architecture

Read `design.json.cssArchitecture` to determine refactoring strategy:

**Tailwind:**
- Map inline styles to Tailwind utility classes
- Example: `margin: 16px; padding: 16px;` → `m-4 p-4`
- Example: `border-radius: 8px;` → `rounded-lg`
- Suggest utility class combinations

**Bootstrap:**
- Map to Bootstrap utility classes
- Example: `margin: 16px;` → `m-3`
- Example: `color: #007bff;` → `text-primary`
- Suggest Bootstrap component classes if applicable

**Custom CSS:**
- Suggest semantic class names based on element context
- Example: `.product-card { margin: 16px; padding: 16px; }`
- Example: `.btn-primary { background: #007bff; }`
- Check if class already exists before suggesting new one

**None (no CSS architecture):**
- Suggest creating a basic stylesheet structure
- Offer to create `wwwroot/css/clain-generated.css`
- Use semantic class naming

### 4. Generate refactoring suggestions

For each inline style pattern, present options:

**Option A: Extract to existing class**
```diff
- <div style="margin: 16px; padding: 16px;">
+ <div class="card-container">

/* In site.css */
.card-container {
  margin: 16px;
  padding: 16px;
}
```

**Option B: Use utility classes (Tailwind/Bootstrap)**
```diff
- <div style="margin: 16px; padding: 16px;">
+ <div class="m-4 p-4">
```

**Option C: Keep inline (one-off styles)**
```
<div style="margin-top: -2px;"> ← Keep (specific adjustment)
```

### 5. Present consolidation UI

Show VS Code webview with refactoring preview:

```
Style Consolidation Report

Found 23 inline styles across 5 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pattern #1: Card container spacing (8 occurrences)
  margin: 16px; padding: 16px; border-radius: 8px;
  
Suggested fix:
  ○ Extract to class "card-container"
  ○ Use Tailwind "m-4 p-4 rounded-lg"
  ○ Keep inline
  
Affected files:
  - Views/Products/Index.cshtml (3)
  - Views/Home/Index.cshtml (5)
  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Apply Selected] [Preview Diff] [Skip All]
```

### 6. Apply refactoring

Based on user selections:

**For "Extract to class":**
1. Create or update CSS file (`site.css`, `clain-generated.css`)
2. Add class definition with extracted styles
3. Replace inline styles with class reference in .cshtml files
4. Preserve any remaining unique inline styles

**For "Use utility classes":**
1. Map inline styles to utility class equivalents
2. Replace inline styles with utility classes
3. Handle unmappable styles (keep inline with comment)

**For "Keep inline":**
1. Leave style attribute unchanged
2. Optionally add comment: `<!-- Clain: intentional inline -->`

### 7. Generate diff preview

Before applying changes, show unified diff:

```diff
--- Views/Products/Index.cshtml
+++ Views/Products/Index.cshtml
@@ -15,7 +15,7 @@
-    <div style="margin: 16px; padding: 16px; border-radius: 8px;">
+    <div class="card-container">

--- wwwroot/css/site.css
+++ wwwroot/css/site.css
@@ -120,0 +120,5 @@
+.card-container {
+    margin: 16px;
+    padding: 16px;
+    border-radius: 8px;
+}
```

Require user confirmation before applying.

### 8. Apply changes

Execute refactoring:
1. Update CSS files (create if needed)
2. Update .cshtml files with new classes
3. Verify no syntax errors introduced
4. Show summary of changes

## Output

Report to user:
```
✓ Analyzed 23 inline styles
✓ Identified 4 refactoring patterns
✓ Applied consolidation:
  - Extracted 3 new classes
  - Converted 8 styles to utilities
  - Kept 2 inline (intentional)
  
Modified files:
  - Views/Products/Index.cshtml
  - Views/Home/Index.cshtml
  - wwwroot/css/site.css
  
Review changes with git diff before committing.
```

## Error handling

- **No inline styles found**: Show info message, no action needed
- **CSS file not writable**: Show error, suggest manual extraction
- **Invalid CSS generated**: Roll back changes, show error
- **Merge conflict in CSS**: Show warning, suggest manual resolution

## Advanced options

### Batch processing

For large projects, offer batch mode:
- Analyze all inline styles at once
- Auto-apply safe refactorings (3+ duplicates)
- Generate report for manual review

### CSS architecture migration

Detect mismatched patterns:
- Tailwind project with custom classes → suggest migration
- Bootstrap project with inline styles → suggest utilities
- Offer to standardize approach

### Preserve formatting

Maintain code style:
- Match existing indentation in CSS files
- Preserve .cshtml formatting
- Use project's line ending convention

## Notes

- This skill only suggests refactoring, never auto-applies without confirmation
- Preserves functional equivalence (styles render identically)
- Respects `design.json.constraints` (e.g., "No inline styles in production")
- Generated CSS classes use semantic naming based on element context
- AI decision-making based on project CSS architecture, not hardcoded rules
