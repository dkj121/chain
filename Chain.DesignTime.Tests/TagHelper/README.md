# Tag Helper Tests

Tests for the `ChainSourceTagHelper` that injects `data-chain-src` attributes into Razor Pages/MVC views (`.cshtml` files).

## Test Coverage

### ChainSourceTagHelperTests
Verifies the core Tag Helper functionality.

**Coverage:**
- Attribute injection when source span is available
- Attribute format correctness (file:line:char)
- Source span extraction from Razor compiler context
- Reflection-based fallback for different Razor compiler versions
- Skip injection for dynamically generated elements

### EnvironmentGatingTests
Verifies environment-based conditional attribute emission.

**Coverage:**
- Attributes emitted in Development environment
- Attributes emitted in ChainDesign environment
- No attributes in Production environment
- Environment detection using shared utilities
- Integration with `IHostEnvironment`

### AttributeInjectionAssert
Helper class for verifying `data-chain-src` attribute presence in test outputs.

**Note:** Attribute injection is Debug-only (`#if DEBUG`), so assertions only run in Debug builds.

### StubHostEnvironment
Test double for `IHostEnvironment` that allows tests to control the environment name.

## Test Framework

- **xUnit** - Test framework
- **Target**: .NET 10.0

## Running Tests

```bash
dotnet test Chain.DesignTime.Tests.csproj --filter "FullyQualifiedName~TagHelper"
```
