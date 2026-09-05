# Source Generator Tests

Tests for the `ClainBlazorSourceGenerator` that injects `data-clain-src` attributes into Blazor components (`.razor` files).

## Test Coverage

### ClainBlazorSourceGeneratorTests
Verifies the Blazor source generator functionality.

**Phase 1 Coverage:**
- Generator produces source for components with `<div>` elements
- Generator skips files without target elements
- Conditional compilation (`#if DEBUG || CLAIN_DESIGN`) in generated code
- Normalized file paths (forward slashes) in generated code
- Partial class generation with correct component name
- Post-initialization output registration

**Test Approach:**
- **Compilation testing**: Verifies generated code compiles successfully
- **Assertion-based**: Checks specific elements in generated code
- **In-memory testing**: Uses `InMemoryAdditionalText` for .razor file simulation

## Test Infrastructure

### InMemoryAdditionalText
In-memory implementation of `AdditionalText` for testing source generators without file I/O.

Allows tests to pass .razor file content directly to the generator.

## Future Test Expansion

**Phase 2+:**
- Snapshot testing for regression detection
- Full `BuildRenderTree` modification verification
- Multiple HTML element types
- Component nesting scenarios
- Performance benchmarks for large projects
- All Blazor component base classes

## Test Framework

- **xUnit** - Test framework
- **Microsoft.CodeAnalysis.CSharp** - Roslyn testing APIs
- **Target**: .NET 10.0

## Running Tests

```bash
dotnet test Clain.DesignTime.Tests.csproj --filter "FullyQualifiedName~SourceGenerator"
```
