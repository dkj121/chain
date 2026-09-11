# clain:generate-mock-data - Mock Data Generation

## Purpose

Generate semantic mock data from ViewModel definitions to enable design-time preview without a running backend. Analyzes ViewModel classes, infers realistic data based on property names and types, and creates `mock-data.json` with proper structure.

## When to use

- After running `clain:init` and `clain:analyze-codebase`
- User runs "Clain: Generate Mock Data" command
- Need to preview UI without backend dependencies
- Want AI to populate ViewModels for design work

## Prerequisites

- `.clain/` directory structure exists
- ASP.NET Core project with Controllers and ViewModels
- Project uses strongly-typed ViewModels (not ViewData/ViewBag)

## Steps

### 1. Discover ViewModels

Search for ViewModel definitions:
- `Models/**/*ViewModel.cs`, `ViewModels/**/*.cs`
- Parse `@model` directives in .cshtml files to find referenced types
- Trace Controller actions that return views with models

For each ViewModel found, record:
- Fully qualified type name (e.g., `MyApp.ViewModels.Home.IndexViewModel`)
- Source file location
- Which views consume it (from `@model` directives)

### 2. Parse ViewModel properties

For each ViewModel class, extract:
- Property name and type
- Collection types (List<T>, IEnumerable<T>, etc.)
- Nested object types
- Data annotations (if helpful for semantic inference)

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
```

### 3. Generate semantic mock values

Use property name analysis to infer realistic values:

**String properties:**
- `*Name`, `*Title` → realistic person/product names
- `*Email` → valid email format (alice@example.com)
- `*Url`, `*Image*` → placeholder paths (/images/product.jpg)
- `*Description`, `*Excerpt` → short realistic text
- `*Id` (string) → GUID or short alphanumeric

**Numeric properties:**
- `*Id` → sequential integers (1, 2, 3)
- `*Price`, `*Cost` → realistic prices (19.99, 299.99)
- `*Count`, `*Quantity` → small integers (5, 23, 45)
- `*Rating` → decimal 0-5 range (4.5, 4.7)

**DateTime properties:**
- `*Date`, `*Time`, `*CreatedAt` → recent dates in ISO format
- `PublishedDate` → past dates (last 7 days)
- `UpdatedAt` → very recent dates

**Boolean properties:**
- Mix of true/false for variety
- `IsActive`, `IsVerified` → mostly true
- `InStock` → mix to show different UI states

**Collections:**
- Generate 3-5 items (enough to show patterns, not overwhelming)
- Vary values within collection (different names, prices, states)
- Include edge cases (one out-of-stock item, one unread notification)

### 4. Create mock-data.json structure

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
            "Excerpt": "Learn the basics of building web applications...",
            "Author": "Alice Johnson",
            "PublishedDate": "2026-09-08T14:30:00Z",
            "ViewCount": 1247,
            "LikeCount": 89
          },
          {
            "Id": 2,
            "Title": "Advanced Razor Techniques",
            "Excerpt": "Explore powerful patterns for maintainable views...",
            "Author": "Bob Smith",
            "PublishedDate": "2026-09-10T09:15:00Z",
            "ViewCount": 856,
            "LikeCount": 67
          }
        ]
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

### 5. Trace Controller sources

For each ViewModel, find the Controller action that instantiates it:
- Search `Controllers/**/*.cs` for `return View(new ViewModelType())`
- Record file path and approximate line number in `meta.source`
- If multiple sources found, list the most common one

### 6. Cross-reference with views

For each ViewModel, find consuming views:
- Search `.cshtml` files for `@model MyApp.ViewModels.SomeViewModel`
- Record in `meta.consumedBy` with format: `["Views/Home/Index.cshtml:1"]`
- Line number is where `@model` directive appears

### 7. Verify JSON validity

Before writing:
- Validate JSON structure
- Ensure all dates are ISO 8601 format
- Check no circular references
- Verify all required properties populated

## Output

Report to user:
```
✓ Discovered X ViewModels
✓ Generated semantic mock data
  - Y string properties (names, emails, descriptions)
  - Z numeric properties (IDs, prices, counts)
  - W date properties (recent timestamps)
✓ Created mock-data.json

Next steps:
- Review mock-data.json for accuracy
- Use "Clain: Data Switch" to toggle mock/backend modes
- Run "Clain: Start Preview" with mock data enabled
```

## Error handling

- **No ViewModels found**: Show error, suggest checking Model/ViewModel directory structure
- **Cannot parse ViewModel**: Log warning, skip that ViewModel, continue with others
- **mock-data.json exists**: Ask user if they want to overwrite or merge
- **Invalid property types**: Use generic fallback values (empty string, 0, false)

## Notes

- Focus on **UI rendering data**, not business logic simulation
- Generated data is for design-time preview only, not testing or production
- User can manually edit mock-data.json; regeneration preserves `globalSettings`
- This skill doesn't modify any ViewModel source files
- Date format: Always use ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
