---
name: clain:generate-mock-data
description: Generate semantic mock data from ViewModel definitions to enable design-time preview without a running backend. Use this skill after clain:init and clain:analyze-codebase, when the user runs "Clain Generate Mock Data" command, needs to preview UI without backend dependencies, or wants AI to populate ViewModels for design work. Analyzes ViewModel classes, infers realistic data based on property names and types, and creates mock-data.json with proper structure.
---

# Clain Mock Data Generation

Generate semantic mock data from ViewModel definitions to enable design-time preview without requiring a running backend or database.

## What this skill does

1. Discovers ViewModel classes used in the project
2. Parses ViewModel properties and types
3. Generates realistic mock values based on property names
4. Creates `mock-data.json` with structured mock ViewModels
5. Traces Controller sources and consuming views
6. Validates JSON structure before writing

## Prerequisites

- `.clain/` directory structure exists (run `clain:init` first)
- ASP.NET Core project with Controllers and ViewModels
- Project uses strongly-typed ViewModels (not ViewData/ViewBag)

## Generation Steps

### 1. Discover ViewModels

Search for ViewModel definitions:
- `Models/**/*ViewModel.cs`
- `ViewModels/**/*.cs`
- Parse `@model` directives in `.cshtml` files to find referenced types
- Trace Controller actions that return views with models

For each ViewModel found, record:
- Fully qualified type name (e.g., `MyApp.ViewModels.Home.IndexViewModel`)
- Source file location
- Which views consume it (from `@model` directives)

### 2. Parse ViewModel Properties

For each ViewModel class, extract:
- Property name and type (string, int, decimal, DateTime, bool, etc.)
- Collection types (`List<T>`, `IEnumerable<T>`, arrays)
- Nested object types (complex properties)
- Data annotations (helpful for semantic inference, e.g., `[EmailAddress]`, `[Url]`)

Example parsed structure:
```
MyApp.ViewModels.Products.ProductListViewModel:
  - PageTitle: string
  - Products: List<ProductDto>
    - Id: int
    - Name: string
    - Price: decimal
    - ImageUrl: string
    - InStock: bool
    - Rating: double
```

### 3. Generate Semantic Mock Values

Use property name analysis to infer realistic values. The goal is data that looks real enough for design work, not comprehensive testing.

**String properties:**
- `*Name`, `*Title`, `*Author` → Realistic person/product names ("Alice Johnson", "Getting Started with ASP.NET Core")
- `*Email` → Valid email format (alice@example.com, bob.smith@example.com)
- `*Url`, `*Image*`, `*Avatar*` → Placeholder paths (/images/product.jpg, /avatars/alice.jpg)
- `*Description`, `*Excerpt`, `*Summary` → Short realistic text (1-2 sentences)
- `*Id` (string type) → GUID or short alphanumeric codes

**Numeric properties:**
- `*Id` (int type) → Sequential integers (1, 2, 3, ...)
- `*Price`, `*Cost`, `*Amount` → Realistic prices with decimals (19.99, 299.99, 1499.00)
- `*Count`, `*Quantity`, `*Stock*` → Small integers showing variety (5, 23, 45)
- `*Rating`, `*Score` → Decimal in 0-5 range (4.5, 4.7, 3.8)
- `*ViewCount`, `*LikeCount` → Larger integers (1247, 856, 342)

**DateTime properties:**
- `*Date`, `*Time`, `*CreatedAt`, `*UpdatedAt` → Recent dates in ISO 8601 format
- `PublishedDate`, `PostedDate` → Past dates within last 7 days
- `MemberSince`, `RegisteredAt` → Older dates (months to years ago)
- Always use ISO 8601 format: `"YYYY-MM-DDTHH:mm:ssZ"`

**Boolean properties:**
- Mix of true/false for variety in UI states
- `IsActive`, `IsVerified`, `IsEnabled` → Mostly true
- `InStock`, `IsAvailable` → Mix to show different UI states (some true, some false)

**Collections:**
- Generate 3-5 items (enough to show patterns without overwhelming)
- Vary values within collection (different names, prices, states, dates)
- Include edge cases (one out-of-stock item, one unread notification, one low rating)

### 4. Create mock-data.json Structure

Generate `.clain/mock-data.json`:

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
        "lastUpdated": "2026-09-11T15:00:00Z"
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
            "PublishedDate": "2026-09-08T14:30:00Z",
            "Tags": ["Tutorial", "ASP.NET", "Beginner"],
            "ViewCount": 1247,
            "LikeCount": 89
          },
          {
            "Id": 2,
            "Title": "Advanced Razor Techniques",
            "Excerpt": "Explore powerful patterns for building maintainable Razor views...",
            "Author": "Bob Smith",
            "PublishedDate": "2026-09-10T09:15:00Z",
            "Tags": ["Advanced", "Razor", "Best Practices"],
            "ViewCount": 856,
            "LikeCount": 67
          },
          {
            "Id": 3,
            "Title": "Designing with Clain",
            "Excerpt": "How to leverage AI-driven design tools for ASP.NET Core applications...",
            "Author": "Carol White",
            "PublishedDate": "2026-09-11T16:45:00Z",
            "Tags": ["Design", "Clain", "Tools"],
            "ViewCount": 543,
            "LikeCount": 42
          }
        ],
        "Stats": {
          "TotalUsers": 12483,
          "ActiveToday": 342,
          "TotalPosts": 8756
        }
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

### 5. Trace Controller Sources

For each ViewModel, find the Controller action that instantiates it:
- Search `Controllers/**/*.cs` for `return View(new ViewModelType())`
- Look for patterns like `return View(viewModel);` where viewModel is of that type
- Record file path and approximate line number in `meta.source`
- If multiple sources found, list the most common or first occurrence

### 6. Cross-Reference with Views

For each ViewModel, find consuming views:
- Search `.cshtml` files for `@model MyApp.ViewModels.SomeViewModel`
- Record in `meta.consumedBy` with format: `["Views/Home/Index.cshtml:1"]`
- Line number indicates where `@model` directive appears

This creates traceability from ViewModels to their sources and consumers.

### 7. Verify JSON Validity

Before writing the file:
- Validate JSON structure is well-formed
- Ensure all dates are ISO 8601 format
- Check for circular references (none should exist)
- Verify all required properties are populated
- Confirm nested objects match ViewModel structure

## Completion Report

Show the user:
```
✓ Discovered 8 ViewModels
✓ Generated semantic mock data
  - 45 string properties (names, emails, descriptions)
  - 32 numeric properties (IDs, prices, counts)
  - 18 date properties (recent timestamps)
  - 12 boolean properties (varied states)
✓ Created mock-data.json (24 KB)

Next steps:
- Review mock-data.json for accuracy
- Use "Clain: Data Switch" to toggle mock/backend modes
- Run "Clain: Start Preview" with mock data enabled
```

## Error Handling

- **No ViewModels found**: Show error suggesting to check `Models/` or `ViewModels/` directory structure
- **Cannot parse ViewModel**: Log warning with class name, skip that ViewModel, continue with others
- **mock-data.json exists**: Ask user whether to overwrite or merge with existing data
- **Invalid property types**: Use generic fallback values (empty string `""`, zero `0`, `false`)
- **Circular references detected**: Skip problematic property, log warning

## Important Notes

- Focus on **UI rendering data**, not business logic simulation or comprehensive testing
- Generated data is for design-time preview only, not for testing edge cases or production use
- User can manually edit mock-data.json; regeneration preserves `globalSettings` section
- This skill doesn't modify any ViewModel source files — it only reads them
- Date format must always be ISO 8601: `"YYYY-MM-DDTHH:mm:ssZ"` for proper serialization
- Collections should have 3-5 items to show patterns without cluttering the UI
- Include variety in mock data (different values, some edge cases) to test UI states
