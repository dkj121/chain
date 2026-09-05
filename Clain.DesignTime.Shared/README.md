# Clain.DesignTime.Shared

Shared utilities for Clain design-time source mapping across different ASP.NET Core scenarios.

## Purpose

This library provides common infrastructure used by both:
- **Tag Helper** (for Razor Pages/MVC `.cshtml` files)
- **Blazor Source Generator** (for Blazor `.razor` components)

## Components

### SourceSpanInfo
Represents a source location in a file (file path, line, character). Used to format the `data-clain-src` attribute value.

```csharp
var span = new SourceSpanInfo 
{ 
    FilePath = "Components/Counter.razor",
    Line = 10,
    Character = 5
};
// ToString() => "Components/Counter.razor:10:5"
```

### EnvironmentDetection
Determines whether to emit design-time attributes based on environment name.

- **Design-time environments**: `Development`, `ClainDesign`
- **Production environments**: All others (no attributes emitted)

```csharp
bool isDev = EnvironmentDetection.IsDesignTimeEnvironment("Development"); // true
bool isProd = EnvironmentDetection.IsDesignTimeEnvironment("Production"); // false
```

### PathUtilities
File path manipulation for consistent cross-platform formatting.

```csharp
// Normalize backslashes to forward slashes
string normalized = PathUtilities.NormalizePath(@"C:\Project\file.razor");
// => "C:/Project/file.razor"

// Get relative path
string relative = PathUtilities.GetRelativePath("/home/project", "/home/project/src/file.razor");
// => "src/file.razor"
```

## Target Framework

- **netstandard2.0** - Compatible with both .NET Framework and .NET Core/5+

## Dependencies

None - this is a pure utility library with no external dependencies.
