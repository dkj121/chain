# Clain Design-Time Source Mapping Architecture

## Overview

Clain provides click-to-source navigation for ASP.NET Core applications by injecting `data-clain-src` attributes into HTML elements at build/runtime. This enables the VS Code extension to map browser DOM elements back to their source code locations.

## Architecture Goals

1. **Zero production overhead**: Attributes only in development builds
2. **Precise source mapping**: File, line, and character-level accuracy
3. **Universal coverage**: Support all ASP.NET Core scenarios (Razor Pages, MVC, Blazor)
4. **Minimal developer friction**: Automatic, no manual configuration

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Clain Ecosystem                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │  VS Code         │         │  Browser DevTools       │  │
│  │  Extension       │◄────────┤  data-clain-src attrs   │  │
│  └──────────────────┘         └─────────────────────────┘  │
│         │                                ▲                  │
│         │ opens file                     │ injected at      │
│         ▼                                │ build/runtime    │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │  Source Files    │         │  Rendered HTML          │  │
│  │  .cshtml/.razor  │         │  <div data-clain-src=   │  │
│  └──────────────────┘         │   "file.razor:10:5">    │  │
│                                └─────────────────────────┘  │
│                                          ▲                  │
│                    ┌────────────────────┬┘                 │
│                    │                    │                  │
│         ┌──────────┴──────────┐   ┌────┴──────────────┐   │
│         │  Tag Helper         │   │  Source Generator  │   │
│         │  (Runtime)          │   │  (Compile-time)    │   │
│         │  .cshtml files      │   │  .razor files      │   │
│         └─────────────────────┘   └───────────────────┘   │
│                    │                    │                  │
│                    └────────────────────┘                  │
│                             │                              │
│                    ┌────────┴────────┐                     │
│                    │  Shared Utils   │                     │
│                    │  (Common Logic) │                     │
│                    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Clain.DesignTime.Shared
**Purpose**: Common utilities shared between Tag Helper and Source Generator

**Components**:
- `SourceSpanInfo` - Source location model (file:line:char)
- `EnvironmentDetection` - Design-time environment detection
- `PathUtilities` - Cross-platform path normalization

**Target**: netstandard2.0 (universal compatibility)

### 2. Clain.DesignTime (Tag Helper)
**Purpose**: Runtime attribute injection for Razor Pages/MVC

**How it works**:
1. Tag Helper runs during view rendering
2. Checks `IHostEnvironment` for Development/ClainDesign
3. Extracts source location from Razor compiler metadata
4. Injects `data-clain-src` attribute into HTML output

**Conditional compilation**: `#if DEBUG || CLAIN_DESIGN`

**Target**: .NET 10.0 (matches ASP.NET Core version)

### 3. Clain.DesignTime.Blazor (Source Generator)
**Purpose**: Compile-time attribute injection for Blazor components

**How it works**:
1. Roslyn incremental source generator runs during compilation
2. Processes `.razor` files from `AdditionalFiles`
3. Parses Razor syntax tree to find HTML elements
4. Generates partial classes that modify `BuildRenderTree`
5. Injects attribute calls after `OpenElement` calls

**Conditional compilation**: `#if DEBUG || CLAIN_DESIGN`

**Target**: netstandard2.0 (source generator compatibility)

**Phase 1 Status**: Minimal implementation (detects divs, generates placeholders)

## Data Flow

### Razor Pages/MVC (.cshtml)
```
.cshtml file
    ↓ (compiled by Razor)
View with metadata
    ↓ (rendered)
TagHelper.Process()
    ↓ (reads context)
Extract source location
    ↓ (inject)
<div data-clain-src="file.cshtml:10:5">
```

### Blazor (.razor)
```
.razor file
    ↓ (analyzed by generator)
Detect HTML elements
    ↓ (generate)
Partial class with BuildRenderTree wrapper
    ↓ (compile)
Component with injected attributes
    ↓ (render)
<div data-clain-src="file.razor:10:5">
```

## Attribute Format

```
data-clain-src="<normalized-path>:<line>:<character>"
```

**Example**: `data-clain-src="Components/Counter.razor:15:8"`

- Path uses forward slashes (cross-platform)
- Line and character are zero-based internally, formatted as-is
- VS Code extension handles the mapping

## Environment Gating

Attributes are only emitted in design-time environments:

1. **Conditional compilation** (`#if DEBUG || CLAIN_DESIGN`)
   - Code removed entirely in Release builds
   - Custom `CLAIN_DESIGN` symbol for fine-grained control

2. **Runtime environment check** (Tag Helper only)
   - `IHostEnvironment.EnvironmentName == "Development"`
   - Or `IHostEnvironment.EnvironmentName == "ClainDesign"`

## NuGet Package Strategy

**Single package**: `Clain.DesignTime`

**Contents**:
- Clain.DesignTime.dll (Tag Helper)
- Clain.DesignTime.Blazor.dll (Source Generator)
- Clain.DesignTime.Shared.dll (Shared utilities)

**Automatic detection**: User chooses mode in project settings, then system detects file types:
- `.cshtml` files → Tag Helper
- `.razor` files → Source Generator
- Both can be active simultaneously (hybrid projects)

## Performance Considerations

### Tag Helper
- **Runtime overhead**: Minimal (reflection + attribute addition)
- **Only in Development**: Zero production impact
- **Per-element cost**: ~1-2ms for reflection, cached after first access

### Source Generator
- **Compile-time overhead**: Incremental (only changed files reprocessed)
- **Zero runtime cost**: Code generated at compile time
- **Phase 1**: Simple string matching (fast but incomplete)
- **Future**: Full Razor syntax tree parsing (slower but accurate)

## Security Considerations

1. **No sensitive data exposure**: Paths are relative to project root
2. **Development-only**: Completely removed in production builds
3. **No network calls**: All processing is local
4. **No execution risk**: Attributes are data-only (no JavaScript injection)

## Future Enhancements

### Phase 2+
1. Full Razor syntax tree parsing (accurate source locations)
2. All HTML element types (not just `<div>`)
3. Blazor component nesting support
4. Dynamic rendering scenarios
5. Performance optimization for large projects
6. Source maps for minified/bundled output
7. Hot reload integration

## Testing Strategy

### Three-tier approach

1. **Unit tests**: Shared utilities, individual components
2. **Integration tests**: Tag Helper with mock contexts, Generator with Roslyn driver
3. **Manual testing**: VS Code extension end-to-end

### Coverage targets
- Shared utilities: 100%
- Tag Helper: 90%+ (external Razor APIs hard to mock)
- Source Generator: 80%+ (Phase 1 baseline)

## Dependencies

### Production
- Microsoft.AspNetCore.Razor.Runtime (Tag Helper)
- Microsoft.AspNetCore.Razor.Language (Source Generator)
- Microsoft.CodeAnalysis.CSharp (Source Generator)
- Microsoft.Extensions.Hosting.Abstractions (Tag Helper)

### Test
- xUnit
- Microsoft.CodeAnalysis.CSharp (for generator testing)

All dependencies are standard Microsoft packages with stable APIs.

## Version History

- **v0.1.0** (Phase 1): Minimal Blazor support, refactored Tag Helper, shared utilities
- **v0.0.x** (Initial): Tag Helper for .cshtml files only
