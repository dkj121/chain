# Common Tests

Tests for shared utilities in `Clain.DesignTime.Shared`.

## Test Coverage

### EnvironmentDetectionTests
Verifies environment name detection for design-time attribute emission.

**Coverage:**
- Development and ClainDesign environments return true
- Production, Staging, and other environments return false
- Case-insensitive matching
- Null/empty string handling

### PathUtilitiesTests
Verifies path normalization and relative path computation.

**Coverage:**
- Forward/backward slash normalization
- Mixed slash handling
- Relative path computation (same dir, subdirs, parent dirs)
- Cross-platform compatibility
- Null/empty string handling

### SourceSpanInfoTests
Verifies source location formatting.

**Coverage:**
- ToString() format: "file:line:char"
- Property getters/setters
- Empty/default values

## Test Framework

- **xUnit** - Test framework
- **Target**: .NET 10.0

## Running Tests

```bash
dotnet test Clain.DesignTime.Tests.csproj --filter "FullyQualifiedName~Common"
```
