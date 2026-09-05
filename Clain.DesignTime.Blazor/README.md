# Clain.DesignTime.Blazor

Roslyn source generator that injects `data-clain-src` attributes into Blazor components for click-to-source navigation.

## Purpose

Enables VS Code extension to provide click-to-source functionality for Blazor `.razor` files by generating code at compile time that adds source location metadata to HTML elements.

## How It Works

1. **Compile-time analysis**: Runs during Blazor compilation as an incremental source generator
2. **Razor file detection**: Processes `.razor` files from `AdditionalFiles`
3. **Code generation**: Generates partial classes that modify `BuildRenderTree` to inject `data-clain-src` attributes
4. **Conditional compilation**: Only active under `#if DEBUG || CLAIN_DESIGN`

## Architecture

### ClainBlazorSourceGenerator
Main source generator implementing `IIncrementalGenerator`.

**Phase 1 (Current)**: Minimal implementation
- Detects components with `<div>` elements
- Generates partial class placeholders
- Documents the attribute injection approach

**Future Phases**:
- Full Razor syntax tree parsing with `Microsoft.AspNetCore.Razor.Language`
- `BuildRenderTree` method interception and modification
- Support for all HTML elements and Blazor component types
- Performance optimization for large projects

## Generated Code Example

For a component `Counter.razor`:

```csharp
#if DEBUG || CLAIN_DESIGN
namespace MyApp.Components
{
    public partial class Counter
    {
        // Wraps BuildRenderTree to inject data-clain-src attributes
        // Original: builder.OpenElement(0, "div");
        // Modified: builder.OpenElement(0, "div");
        //           builder.AddAttribute(1, "data-clain-src", "Components/Counter.razor:10:5");
    }
}
#endif
```

## Usage

This generator is automatically included when the `Clain.DesignTime` NuGet package is installed in a Blazor project.

No manual configuration required - the generator detects `.razor` files and processes them automatically.

## Dependencies

- **Microsoft.CodeAnalysis.CSharp** (4.5.0) - Roslyn compiler APIs
- **Microsoft.AspNetCore.Razor.Language** (6.0.0) - Razor syntax tree parsing
- **Clain.DesignTime.Shared** - Common utilities

## Target Framework

- **netstandard2.0** - Compatible with all .NET versions that support source generators
