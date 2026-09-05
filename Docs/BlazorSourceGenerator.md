# Blazor Source Generator Implementation Guide

## Current Status: Phase 1 - Foundation

Phase 1 establishes the infrastructure for Blazor source mapping with a minimal vertical slice.

## What's Implemented

### Infrastructure
- ✅ Roslyn incremental source generator setup
- ✅ `.razor` file detection from `AdditionalFiles`
- ✅ Conditional compilation (`#if DEBUG || CLAIN_DESIGN`)
- ✅ Partial class generation
- ✅ Shared utilities integration
- ✅ Comprehensive test suite

### Minimal Vertical Slice
- ✅ Detects components with `<div>` elements
- ✅ Generates placeholder partial classes
- ✅ Documents the attribute injection approach
- ✅ Path normalization in generated code

## What's NOT Implemented (Future Phases)

### Phase 2: Razor Syntax Tree Parsing
- Parse `.razor` files with `Microsoft.AspNetCore.Razor.Language`
- Extract precise source locations for all HTML elements
- Build element-to-location mapping

### Phase 3: BuildRenderTree Modification
- Intercept `BuildRenderTree` method calls
- Inject `builder.AddAttribute()` calls after `OpenElement()`
- Handle attribute ordering and sequence numbers
- Preserve existing component behavior

### Phase 4: Comprehensive Element Support
- All HTML elements (not just `<div>`)
- Blazor components (`<Counter>`, etc.)
- Component parameters
- Event handlers
- Conditional rendering (`@if`, `@foreach`)

### Phase 5: Advanced Scenarios
- Component nesting
- Render fragments
- Cascading parameters
- Dynamic component rendering
- Template components

## Technical Approach

### How Source Generators Work

```csharp
[Generator]
public class ClainBlazorSourceGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // 1. Get input files (.razor)
        var razorFiles = context.AdditionalTextsProvider
            .Where(file => file.Path.EndsWith(".razor"));

        // 2. Combine with compilation
        var compilationAndFiles = context.CompilationProvider
            .Combine(razorFiles.Collect());

        // 3. Generate source for each file
        context.RegisterSourceOutput(compilationAndFiles, Generate);
    }
}
```

### Target Transformation

**Original Blazor Component** (`Counter.razor`):
```razor
@page "/counter"

<h3>Counter</h3>
<div>Current count: @currentCount</div>

@code {
    private int currentCount = 0;
}
```

**Generated C# by Blazor** (simplified):
```csharp
public partial class Counter : ComponentBase
{
    protected override void BuildRenderTree(RenderTreeBuilder builder)
    {
        builder.OpenElement(0, "h3");
        builder.AddContent(1, "Counter");
        builder.CloseElement();

        builder.OpenElement(2, "div");
        builder.AddContent(3, "Current count: ");
        builder.AddContent(4, currentCount);
        builder.CloseElement();
    }
}
```

**Our Generator Should Add** (Phase 2+):
```csharp
#if DEBUG || CLAIN_DESIGN
public partial class Counter
{
    private void BuildRenderTreeOriginal(RenderTreeBuilder builder)
    {
        // Original BuildRenderTree moved here
    }

    protected override void BuildRenderTree(RenderTreeBuilder builder)
    {
        var wrappedBuilder = new ClainRenderTreeBuilder(builder, "Counter.razor");

        wrappedBuilder.OpenElement(0, "h3", line: 3, char: 0);
        wrappedBuilder.AddContent(1, "Counter");
        wrappedBuilder.CloseElement();

        wrappedBuilder.OpenElement(2, "div", line: 4, char: 0);
        wrappedBuilder.AddContent(3, "Current count: ");
        wrappedBuilder.AddContent(4, currentCount);
        wrappedBuilder.CloseElement();
    }
}
#endif
```

**ClainRenderTreeBuilder Wrapper**:
```csharp
internal class ClainRenderTreeBuilder
{
    private readonly RenderTreeBuilder _inner;
    private readonly string _sourceFile;

    public void OpenElement(int sequence, string elementName, int line, int character)
    {
        _inner.OpenElement(sequence, elementName);
        _inner.AddAttribute(sequence + 1, "data-clain-src", $"{_sourceFile}:{line}:{character}");
    }

    // Other methods delegate to _inner...
}
```

## Implementation Challenges

### 1. Razor Compilation Model
Blazor compiles `.razor` → C# → IL. We need to intercept between steps 1 and 2.

**Solution**: Parse `.razor` with `RazorProjectEngine`, extract syntax tree, generate parallel partial class.

### 2. BuildRenderTree Complexity
Real components have complex render trees with conditionals, loops, components.

**Solution**: Start simple (Phase 1 div-only), incrementally add support for each scenario.

### 3. Sequence Numbers
`BuildRenderTree` uses sequence numbers for efficient diffing. Injecting attributes changes sequences.

**Solution**: Wrapper pattern maintains sequence integrity by using subsequences.

### 4. Component Inheritance
Components inherit from `ComponentBase` or custom bases. Cannot directly override `BuildRenderTree` from generator.

**Solution**: Use partial classes to add wrapper methods that the component can call.

### 5. Multiple File Generation
Large projects have hundreds of `.razor` files. Generator must be incremental.

**Solution**: Use `IncrementalValuesProvider` so only changed files are reprocessed.

## Development Workflow

### Testing the Generator

```bash
# Build the generator
dotnet build Clain.DesignTime.Blazor/Clain.DesignTime.Blazor.csproj

# Run generator tests
dotnet test --filter "FullyQualifiedName~SourceGenerator"

# Manual testing: Create a test Blazor project
dotnet new blazor -o TestBlazorApp
cd TestBlazorApp
dotnet add reference ../Clain.DesignTime.Blazor/Clain.DesignTime.Blazor.csproj

# Build and inspect generated files
dotnet build
# Generated files are in: obj/Debug/net8.0/generated/
```

### Debugging the Generator

1. Set breakpoints in `ClainBlazorSourceGenerator.cs`
2. Debug a test that runs the generator
3. Or attach to `dotnet build` process (advanced)

**Tip**: Use `context.AddSource()` liberally to see what's being generated.

## Next Steps (Phase 2)

1. **Add Razor parsing**:
   ```csharp
   var engine = RazorProjectEngine.Create(...);
   var document = engine.Process(razorFile);
   var syntaxTree = document.GetSyntaxTree();
   ```

2. **Extract element locations**:
   ```csharp
   var visitor = new ElementLocationVisitor();
   visitor.Visit(syntaxTree);
   var elements = visitor.Elements; // List<(string tag, int line, int char)>
   ```

3. **Generate BuildRenderTree wrapper**:
   ```csharp
   var code = GenerateBuildRenderTreeWrapper(componentName, elements);
   context.AddSource($"{componentName}.BuildRenderTree.g.cs", code);
   ```

4. **Test thoroughly**:
   - Unit tests for parser
   - Integration tests with real .razor files
   - Manual testing in VS Code

## Resources

- [Source Generators Cookbook](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md)
- [Incremental Generators](https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.md)
- [Razor Compiler](https://github.com/dotnet/razor)
- [Blazor Rendering](https://learn.microsoft.com/en-us/aspnet/core/blazor/components/rendering)

## Performance Targets

- **Small projects** (<50 components): <1s incremental build overhead
- **Medium projects** (50-200 components): <3s incremental build overhead  
- **Large projects** (200+ components): <10s incremental build overhead

Phase 1 has minimal overhead (simple string matching). Full implementation will need caching and optimization.
