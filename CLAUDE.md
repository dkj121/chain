# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chain** is an AI-driven, code-centric visual design tool for ASP.NET Core Razor applications. It positions code itself as the design language, inverting the traditional design-to-code workflow by making code the single source of truth.

### Core Concept

Unlike traditional WYSIWYG tools (Blend, Webflow) that use pre-built component libraries, Chain leverages AI to dynamically discover, search, and generate components from the actual project codebase. This creates a hybrid experience:
- **For developers**: Enhanced Razor preview with live code synchronization
- **For designers**: Component-based visual assembly without requiring deep Razor knowledge

### Target Users

Primary: Frontend/fullstack ASP.NET Core developers  
Secondary: Designers familiar with component-based workflows (Figma/Pen)

## Architecture

### Implementation Approach

**Phase 1 (MVP)**: VS Code Extension  
**Phase 2**: Evaluate migration to standalone Electron app if canvas/advanced features require it

### Technology Stack

- **Extension Host**: TypeScript (VS Code Extension API)
- **Preview Rendering**: Embedded ASP.NET Core Kestrel server
- **Source Mapping**: Custom Razor Tag Helper (`Chain.DesignTime` NuGet package)
- **AI Integration**: Claude Code Skills + API
- **Hot Reload**: .NET 6+ built-in hot reload capability

### UI Layout Philosophy

Chain integrates into VS Code's native windowing system without fixed positions:

```
┌──────────┬────────────────────────────────────┬──────────────┐
│ Explorer │                                    │ Chat         │
│ Chain    │        Editor Area                 │ (Claude)     │
│ ├─Files  │  ┌──────────────────────────────┐  │              │
│ └─Toolbox│  │ Code View / Preview / Props  │  │              │
│          │  │ (movable panels)             │  │              │
│          │  └──────────────────────────────┘  │              │
│          │                                    │              │
├──────────┴────────────────────────────────────┴──────────────┤
│ Terminal / Problems / Output                                 │
└──────────────────────────────────────────────────────────────┘
```

**Key Design Principles**:
- **Code View**: Razor source editor with syntax highlighting and IntelliSense
- **Preview View**: Live iframe rendering from Kestrel, with click-to-locate
- **Properties View**: Attribute editor + live code preview panel
- **Canvas View**: (Future) Multi-page overview for project-wide design navigation

All views are **movable VS Code panels**, not fixed sidebars. Users can arrange them like any editor tab/panel (split vertical/horizontal, drag to edges).

### Component Discovery & AI Toolbox

The toolbox dynamically populates by:
1. **Static Analysis**: Scanning `Views/Shared/`, `ViewComponents/` at extension activation
2. **AI Search**: Natural language queries → Claude matches/generates components
3. **Drag-to-Insert**: AI translates drop location (via `data-chain-src`) into code insertion

**Toolbox UI** (sidebar or panel):
```
┌──────────────────┐
│ 🔍 搜索组件...    │ ← AI-powered search
├──────────────────┤
│ 📦 项目组件       │
│  ├─ _Card        │ ← Extracted from project
│  ├─ _ProductList │
│  └─ _Header      │
└──────────────────┘
```

### Source Mapping Mechanism

**Problem**: Map rendered HTML elements back to original .cshtml source locations.

**Solution**: Inject `data-chain-src` attributes via custom Tag Helper during Razor compilation.

**Implementation** (`Chain.DesignTime` NuGet package):
```csharp
[HtmlTargetElement("*")]
public class ChainSourceTagHelper : TagHelper
{
    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        var sourceSpan = GetRazorSourceSpan(context); // From Razor compiler
        if (sourceSpan != null)
        {
            output.Attributes.Add("data-chain-src", 
                $"{sourceSpan.FilePath}:{sourceSpan.LineIndex}:{sourceSpan.CharacterIndex}");
        }
    }
}
```

**Coverage**: ~90% of elements (excludes `@Html.Raw()` and legacy HtmlHelper outputs).

**Click-to-Locate Flow**:
1. User clicks element in preview iframe
2. JavaScript extracts `data-chain-src` → posts message to extension host
3. Extension calls `vscode.window.showTextDocument()` with parsed location
4. Code editor jumps to exact line/column

### Temporary Style System

**User Action**: Modify styles via properties panel  
**Immediate Effect**: Inject inline `style=""` attribute to .cshtml  
**After All**: Remind users to trigger `chain:style-consolidation` skill

**AI Consolidation Logic**:
- Detect CSS architecture (Tailwind/Bootstrap/custom)
- Group similar inline styles across elements
- Suggest: extract to class / modify existing class / keep inline
- Present diff → user approves → apply refactoring

This avoids hardcoded "always create class" rules while maintaining code quality.

### Breadcrumb Navigation & Scope Detection

**Component Hierarchy**: When user selects an element, show its ancestry chain:
```
_Layout > main > @foreach(var item in Model.Items) > div.card
```

**Drag Target Indication**: During drag operations, breadcrumb updates to show where the component will land (inside `@foreach` vs outside).

**Scope Constraint Enforcement** (Q20 solution):
- Real-time AST analysis detects variable scope boundaries
- Prevent dragging `@item.Name` outside its `@foreach` loop (compilation would fail)
- Show禁止cursor when hovering invalid drop zones
- Offer "Ask AI to refactor" button for complex moves

## File Structure

```
.
├── .chain/
│   ├── docs/               # Skill definitions (Markdown format)
│   │   ├── init.md
│   │   ├── analyze-codebase.md
│   │   ├── data-switch.md
│   │   └── style-consolidation.md
│   ├── design.json         # Project design index (pages, components, tokens)
│   ├── config.json         # Chain VS Code extension settings
│   └── .gitignore          # Exclude workspace.json (per-user state)
├── DESIGN.md               # High-level design philosophy (AI-generated)
└── README.md               # Project documentation
```

## Development Workflow

### Initial Setup (MVP Phase 1)

1. **Create VS Code Extension Skeleton**:
   ```bash
   npm install -g yo generator-code
   yo code  # Select TypeScript extension
   ```

2. **Implement Core Commands**:
   - `Chain: Start Preview` → Launch Kestrel, create Webview panel
   - `Chain: Stop Preview` → Terminate Kestrel process

3. **Develop Chain.DesignTime NuGet Package**:
   ```bash
   dotnet new classlib -n Chain.DesignTime
   # Implement ChainSourceTagHelper
   dotnet pack
   ```

4. **Webview UI Development**:
   - Preview iframe (points to `http://localhost:5000`)
   - Properties panel (class/id editor + code preview)
   - Toolbox panel (component list + AI search)

### Testing Strategy

- **Unit Tests**: TypeScript extension logic (mock VS Code API)
- **Integration Tests**: Launch real Kestrel server, verify source mapping
- **Manual Testing**: Use sample ASP.NET Core MVC project

### Key Technical Challenges

1. **Tag Helper Coverage Blind Spots**:  
   - `@Html.Raw()` and legacy HtmlHelper outputs don't go through Tag Helper pipeline
   - **MVP Solution**: Mark these as "unselectable" in preview (show tooltip: "Legacy code, edit directly")
   - **Future**: Provide `chain migrate` to rewrite HtmlHelper → Tag Helper

2. **Conditional Rendering Ambiguity**:  
   - Element inside `@if` block may exist 0 or 1 times in DOM
   - **Solution**: Breadcrumb shows full context (`@if > div`), AI insertion respects block boundaries

3. **Kestrel Startup Failures**:  
   - Database dependencies, external services may prevent startup
   - **Solution**: Provide `ASPNETCORE_ENVIRONMENT=ChainDesign` mode with middleware that mocks external dependencies
   - **Fallback**: Static AST analysis mode (no live preview, only structure view)

## Future Roadmap

### Phase 2: Enhanced Visual Editing
- Full drag-and-drop component assembly
- Canvas view for multi-page layout
- Design token visual editor

### Phase 3: Multi-Framework Support
- **React**: Transform approach for JSX/TSX components
- **Vue**: Support SFC (Single File Components) with `<template>` analysis
- **Blazor**: Natural fit (similar Razor syntax)

### Phase 4: Collaboration Features
- Git-based design state sync
- Multi-user mock data sharing
- Design review workflows

## Commands Reference

### Extension Commands (VS Code Command Palette)

- `Chain: Start Preview` → Launch preview + toolbox

### CLI Commands (Future)

```bash
chain init              # Initialize project
chain analyze           # Scan codebase
chain design            # Interactive DESIGN.md generation
chain migrate           # Convert HtmlHelper to Tag Helper
```

## Design Principles

1. **Code as Source of Truth**: Never create a separate representation of the UI. All design operations modify actual .cshtml files.

2. **AI as Component Provider**: No static component library. AI dynamically discovers or generates components based on project context.

3. **Transparent Operations**: Every visual edit shows corresponding code changes. Users always understand what Chain is modifying.

4. **Graceful Degradation**: If advanced features fail (Kestrel won't start, AI unavailable), core code editing still works.

5. **Framework Agnostic (Future)**: Core concepts (source mapping, AI component discovery, temporary styles) apply to React/Vue with different implementations.

## Notes for Future Claude Instances

- **Don't Hardcode CSS Rules**: Always use AI to decide style extraction strategy based on project's CSS architecture.
- **Respect Scope Boundaries**: Never generate code that moves elements outside their variable scope without explicit user confirmation.
- **Preserve Formatting**: Match existing Razor indentation and style when inserting code.
- **Fail Visible**: If source mapping fails or AI is uncertain, show clear UI indication rather than silent degradation.
- **User Confirms Destructive Changes**: Any bulk refactoring (style consolidation, component extraction) requires explicit user approval via diff preview.
