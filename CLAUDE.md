# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Clain** is an AI-driven, code-centric visual design tool for ASP.NET Core Razor applications. It positions code itself as the design language, inverting the traditional design-to-code workflow by making code the single source of truth.

### Core Concept

Unlike traditional WYSIWYG tools (Blend, Webflow) that use pre-built component libraries, Clain leverages AI to dynamically discover, search, and generate components from the actual project codebase. This creates a hybrid experience:
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
- **Source Mapping**: Custom Razor Tag Helper (`Clain.DesignTime` NuGet package)
- **AI Integration**: Claude Code Skills + API
- **Hot Reload**: .NET 6+ built-in hot reload capability

### UI Layout Philosophy

Clain integrates into VS Code's native windowing system without fixed positions:

```
┌──────────┬────────────────────────────────────┬──────────────┐
│ Explorer │                                    │ Chat         │
│ Clain    │        Editor Area                 │ (Claude)     │
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
3. **Drag-to-Insert**: AI translates drop location (via `data-clain-src`) into code insertion

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

**Solution**: Inject `data-clain-src` attributes via custom Tag Helper during Razor compilation.

**Implementation** (`Clain.DesignTime` NuGet package):
```csharp
[HtmlTargetElement("*")]
public class ClainSourceTagHelper : TagHelper
{
    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        var sourceSpan = GetRazorSourceSpan(context); // From Razor compiler
        if (sourceSpan != null)
        {
            output.Attributes.Add("data-clain-src", 
                $"{sourceSpan.FilePath}:{sourceSpan.LineIndex}:{sourceSpan.CharacterIndex}");
        }
    }
}
```

**Coverage**: ~90% of elements (excludes `@Html.Raw()` and legacy HtmlHelper outputs).

**Click-to-Locate Flow**:
1. User clicks element in preview iframe
2. JavaScript extracts `data-clain-src` → posts message to extension host
3. Extension calls `vscode.window.showTextDocument()` with parsed location
4. Code editor jumps to exact line/column

### Temporary Style System

**User Action**: Modify styles via properties panel  
**Immediate Effect**: Inject inline `style=""` attribute to .cshtml  
**After All**: Remind users to trigger `clain:style-consolidation` skill

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

## Clain Skills

Skills are loaded into Claude Code's context to standardize AI behavior. Located in `.clain/docs/` (later migrated to `.claude/skills/clain/`).

### Core Skills (MVP)

1. **`clain:init`**  
   Initialize `.clain/` structure, add `Clain.DesignTime` NuGet package. And conduct grill-me style interview to extract design philosophy, visual language, component strategy, constraints. Generate `DESIGN.md` and `design.json` focused on high-level design principles (not component catalogs).

2. **`clain:analyze-codebase`**  
   For excited project, scan project for pages/components, detect CSS architecture (Tailwind/Bootstrap/custom), extract design tokens, populate `design.json` and `DESIGN.md`.

3. **`clain:generate-mock-data`**  
   Parse ViewModel definitions, generate semantic mock data (e.g., `UserName → "Alice Johnson"`), save to `mock-data.json`, configure injection in Development environment.

4. `clain:data-switch`
   A pop-up appears, allowing you to select the current data mode (mock data or real backend data).

5. **`clain:style-consolidation`**  
   Analyze inline `style=""` attributes, group by similarity, check CSS architecture, suggest refactoring (extract class / modify existing / keep inline), present diff for approval.

### design.json Structure

```json
{
  "meta": {
    "version": "1.0",
    "projectName": "MyApp",
    "lastUpdated": "2026-08-27T10:00:00Z"
  },
  "pages": [
    {
      "route": "/",
      "file": "Views/Home/Index.cshtml",
      "layout": "_Layout.cshtml",
      "dependencies": ["_Header.cshtml"]
    }
  ],
  "components": [
    {
      "name": "_Card",
      "file": "Views/Shared/_Card.cshtml",
      "type": "partial",
      "usedBy": ["/", "/products"]
    }
  ],
  "designTokens": {
    "colors": { "primary": "#007bff" },
    "typography": { "baseFontSize": "16px" }
  },
  "cssArchitecture": "tailwind",
  "constraints": [
    "All buttons must use .btn base class",
    "No inline styles in production code"
  ]
}
```

### mock-data.json Purpose

**Focus**: UI rendering data only (not business logic simulation).

**AI Responsibility**: Analyze Controller → ViewModel → View data flow through skills, but mock.json contains only the ViewModel JSON structure needed for design-time rendering and use `clain:data-switch` to switch between mock or real backend data.

**User Expectation**: "方便 AI 修改" means AI can replace mock data with proper frontend-backend contract structure before production deployment.

### mock-data.json Example

```json
{
  "$schema": "https://clain.dev/schemas/mock-data.schema.json",
  "version": "1.0",
  "models": {
    "MyApp.ViewModels.Home.IndexViewModel": {
      "meta": {
        "source": "Controllers/HomeController.cs:34",
        "consumedBy": ["Views/Home/Index.cshtml:1"],
        "generatedBy": "ai-semantic",
        "lastUpdated": "2026-08-27T10:30:00Z"
      },
      "data": {
        "Title": "Welcome to MyApp",
        "User": {
          "UserName": "Alice Johnson",
          "Email": "alice@example.com",
          "AvatarUrl": "/images/avatars/alice.jpg",
          "MemberSince": "2024-03-15T00:00:00Z",
          "IsVerified": true
        },
        "RecentPosts": [
          {
            "Id": 1,
            "Title": "Getting Started with ASP.NET Core",
            "Excerpt": "Learn the basics of building web applications with ASP.NET Core framework...",
            "Author": "Alice Johnson",
            "PublishedDate": "2026-08-20T14:30:00Z",
            "Tags": ["Tutorial", "ASP.NET", "Beginner"],
            "ViewCount": 1247,
            "LikeCount": 89
          },
          {
            "Id": 2,
            "Title": "Advanced Razor Techniques",
            "Excerpt": "Explore powerful patterns for building maintainable Razor views...",
            "Author": "Bob Smith",
            "PublishedDate": "2026-08-25T09:15:00Z",
            "Tags": ["Advanced", "Razor", "Best Practices"],
            "ViewCount": 856,
            "LikeCount": 67
          },
          {
            "Id": 3,
            "Title": "Designing with Clain",
            "Excerpt": "How to leverage AI-driven design tools for ASP.NET Core applications...",
            "Author": "Carol White",
            "PublishedDate": "2026-08-26T16:45:00Z",
            "Tags": ["Design", "Clain", "Tools"],
            "ViewCount": 543,
            "LikeCount": 42
          }
        ],
        "Stats": {
          "TotalUsers": 12483,
          "ActiveToday": 342,
          "TotalPosts": 8756,
          "TotalComments": 23419
        }
      }
    },
    "MyApp.ViewModels.Products.ProductListViewModel": {
      "meta": {
        "source": "Controllers/ProductsController.cs:28",
        "consumedBy": ["Views/Products/Index.cshtml:1"],
        "generatedBy": "ai-semantic",
        "lastUpdated": "2026-08-27T11:00:00Z"
      },
      "data": {
        "PageTitle": "Product Catalog",
        "Categories": ["Electronics", "Clothing", "Books", "Home & Garden"],
        "SelectedCategory": "Electronics",
        "Products": [
          {
            "Id": 101,
            "Name": "Wireless Headphones",
            "Description": "Premium noise-canceling wireless headphones with 30-hour battery life",
            "Price": 199.99,
            "Currency": "USD",
            "ImageUrl": "/images/products/headphones.jpg",
            "Rating": 4.5,
            "ReviewCount": 328,
            "InStock": true,
            "StockQuantity": 45
          },
          {
            "Id": 102,
            "Name": "Smart Watch",
            "Description": "Fitness tracking smartwatch with heart rate monitor and GPS",
            "Price": 299.99,
            "Currency": "USD",
            "ImageUrl": "/images/products/smartwatch.jpg",
            "Rating": 4.7,
            "ReviewCount": 512,
            "InStock": true,
            "StockQuantity": 23
          },
          {
            "Id": 103,
            "Name": "Laptop Stand",
            "Description": "Ergonomic aluminum laptop stand with adjustable height",
            "Price": 49.99,
            "Currency": "USD",
            "ImageUrl": "/images/products/laptop-stand.jpg",
            "Rating": 4.3,
            "ReviewCount": 189,
            "InStock": false,
            "StockQuantity": 0
          }
        ],
        "Pagination": {
          "CurrentPage": 1,
          "TotalPages": 12,
          "PageSize": 20,
          "TotalItems": 234
        },
        "Filters": {
          "PriceRange": {
            "Min": 0,
            "Max": 1000
          },
          "AvailableOnly": true,
          "SortBy": "popularity"
        }
      }
    },
    "MyApp.ViewModels.Shared.LayoutViewModel": {
      "meta": {
        "source": "Controllers/BaseController.cs:15",
        "consumedBy": ["Views/Shared/_Layout.cshtml:1"],
        "generatedBy": "ai-semantic",
        "lastUpdated": "2026-08-27T09:45:00Z",
        "note": "Shared across all pages"
      },
      "data": {
        "SiteName": "MyApp Platform",
        "LogoUrl": "/images/logo.svg",
        "CurrentUser": {
          "IsAuthenticated": true,
          "DisplayName": "Alice Johnson",
          "ProfileUrl": "/profile/alice"
        },
        "Navigation": [
          {
            "Text": "Home",
            "Url": "/",
            "Icon": "home",
            "IsActive": true
          },
          {
            "Text": "Products",
            "Url": "/products",
            "Icon": "shopping-cart",
            "IsActive": false
          },
          {
            "Text": "Blog",
            "Url": "/blog",
            "Icon": "edit",
            "IsActive": false
          },
          {
            "Text": "About",
            "Url": "/about",
            "Icon": "info",
            "IsActive": false
          }
        ],
        "Notifications": [
          {
            "Id": "n1",
            "Type": "info",
            "Message": "New features available in Clain v1.2",
            "Timestamp": "2026-08-27T08:30:00Z",
            "IsRead": false
          },
          {
            "Id": "n2",
            "Type": "success",
            "Message": "Your design was saved successfully",
            "Timestamp": "2026-08-26T15:20:00Z",
            "IsRead": true
          }
        ],
        "FooterLinks": [
          {
            "Text": "Privacy Policy",
            "Url": "/privacy"
          },
          {
            "Text": "Terms of Service",
            "Url": "/terms"
          },
          {
            "Text": "Contact Us",
            "Url": "/contact"
          }
        ],
        "CopyrightYear": 2026
      }
    }
  },
  "globalSettings": {
    "dataMode": "mock",
    "fallbackToMockOnError": true,
    "mockDelay": 0,
    "notes": [
      "Set dataMode to 'backend' to use real API data",
      "Use clain:data-switch skill to toggle between modes",
      "mockDelay (ms) simulates network latency for testing"
    ]
  }
}
```

**Key Structure Explanation**:

1. **`models` object**: Indexed by fully qualified ViewModel type name (matches `@model` directive in Razor views)

2. **`meta` object per model**:
   - `source`: Where the ViewModel is populated (Controller action)
   - `consumedBy`: Which Razor views use this ViewModel
   - `generatedBy`: How the mock data was created (`"ai-semantic"` | `"ai-recorded"` | `"manual"`)
   - `lastUpdated`: Timestamp for tracking staleness

3. **`data` object**: The actual mock ViewModel structure, with semantically meaningful values:
   - String properties → realistic names, descriptions
   - DateTime → recent, context-appropriate dates
   - Collections → 3-5 sample items showing variation
   - Booleans → mix of true/false for different UI states
   - Numbers → realistic ranges (prices, counts, ratings)

4. **`globalSettings`**:
   - `dataMode`: `"mock"` (use mock-data.json) or `"backend"` (use real Controllers/APIs)
   - `fallbackToMockOnError`: If backend fails, use mock data (useful during development)
   - `mockDelay`: Simulate network latency (0 = instant, 500 = half-second delay)

**AI Generation Strategy** (via `clain:generate-mock-data` skill):
- Parse ViewModel class definitions (properties, types, attributes)
- Analyze property names for semantic hints (`UserName` → person name, `Email` → valid email format)
- Generate 3-5 items for collections (enough to show patterns, not overwhelming)
- Include edge cases (e.g., one product out of stock, one notification unread)
- Record `meta.source` by tracing Controller actions that instantiate the ViewModel

## File Structure

```
.
├── .clain/
│   ├── docs/               # Skill definitions (Markdown format)
│   │   ├── init.md
│   │   ├── analyze-codebase.md
│   │   ├── generate-mock-data.md
│   │   ├── data-switch.md
│   │   └── style-consolidation.md
│   ├── design.json         # Project design index (pages, components, tokens)
│   ├── mock-data.json      # Render-time mock ViewModels
│   ├── config.json         # Clain VS Code extension settings
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
   - `Clain: Start Preview` → Launch Kestrel, create Webview panel
   - `Clain: Stop Preview` → Terminate Kestrel process
   - `Clain: Init Project` → Run `clain:init-project` skill

3. **Develop Clain.DesignTime NuGet Package**:
   ```bash
   dotnet new classlib -n Clain.DesignTime
   # Implement ClainSourceTagHelper
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
   - **Future**: Provide `clain migrate` to rewrite HtmlHelper → Tag Helper

2. **Conditional Rendering Ambiguity**:  
   - Element inside `@if` block may exist 0 or 1 times in DOM
   - **Solution**: Breadcrumb shows full context (`@if > div`), AI insertion respects block boundaries

3. **Kestrel Startup Failures**:  
   - Database dependencies, external services may prevent startup
   - **Solution**: Provide `ASPNETCORE_ENVIRONMENT=ClainDesign` mode with middleware that mocks external dependencies
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

- `Clain: Init Project` → Initialize `.clain/` structure
- `Clain: Start Preview` → Launch preview + toolbox
- `Clain: Analyze Codebase` → Scan and update design.json
- `Clain: Generate Mock Data` → Create mock-data.json from ViewModels
- `Clain: Update Design Document` → Run grill-me interview for DESIGN.md
- `Clain: Consolidate Styles` → Review and refactor inline styles

### CLI Commands (Future)

```bash
clain init              # Initialize project
clain analyze           # Scan codebase
clain design            # Interactive DESIGN.md generation
clain migrate           # Convert HtmlHelper to Tag Helper
```

## Design Principles

1. **Code as Source of Truth**: Never create a separate representation of the UI. All design operations modify actual .cshtml files.

2. **AI as Component Provider**: No static component library. AI dynamically discovers or generates components based on project context.

3. **Transparent Operations**: Every visual edit shows corresponding code changes. Users always understand what Clain is modifying.

4. **Graceful Degradation**: If advanced features fail (Kestrel won't start, AI unavailable), core code editing still works.

5. **Framework Agnostic (Future)**: Core concepts (source mapping, AI component discovery, temporary styles) apply to React/Vue with different implementations.

## Notes for Future Claude Instances

- **Don't Hardcode CSS Rules**: Always use AI to decide style extraction strategy based on project's CSS architecture.
- **Respect Scope Boundaries**: Never generate code that moves elements outside their variable scope without explicit user confirmation.
- **Preserve Formatting**: Match existing Razor indentation and style when inserting code.
- **Fail Visible**: If source mapping fails or AI is uncertain, show clear UI indication rather than silent degradation.
- **User Confirms Destructive Changes**: Any bulk refactoring (style consolidation, component extraction) requires explicit user approval via diff preview.
