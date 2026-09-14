# TestRazorApp - Clain Extension Test Application

This is a test ASP.NET Core Razor Pages application designed to verify all features of the Clain VS Code Extension.

## Purpose

This application provides comprehensive test coverage for:
- Live preview with hot reload
- Click-to-navigate source mapping (`data-clain-src` attributes)
- Property panel editing
- Breadcrumb navigation
- Nested Razor conditionals and loops
- Partial view rendering

## Structure

### Models
- `HomeViewModel` - Home page data (title, message, features list, visitor count)
- `Product` - Product entity (id, name, description, price, category, stock)
- `ProductListViewModel` - Products page data (title, products, categories, totals)

### Views
- `Views/Home/Index.cshtml` - Home page with hero, features list, and stats
- `Views/Home/Products.cshtml` - Products grid with nested conditionals
- `Views/Shared/_Header.cshtml` - Navigation header partial
- `Views/Shared/_Card.cshtml` - Product card partial (typed to Product model)
- `Views/Shared/_Footer.cshtml` - Footer partial

### Controllers
- `HomeController` - Provides test data for both views

## Test Coverage

### Click-to-Navigate Testing
All major elements have `data-clain-src` attributes:
- Header navigation (`Views/Shared/_Header.cshtml`)
- Product cards (`Views/Shared/_Card.cshtml`)
- Footer (`Views/Shared/_Footer.cshtml`)
- Home page title (`Views/Home/Index.cshtml:8`)

### Conditional Rendering Testing
The Products page includes nested conditionals:
- Category iteration
- Stock status checks (in-stock vs out-of-stock)
- Empty state handling
- Nested loops (categories → products → stock status)

### Hot Reload Testing
Inline styles allow quick visual verification of hot reload:
- Change colors, spacing, or text
- Save the file
- Verify live preview updates without manual refresh

## Running the Application

```bash
cd /home/DKJ/program/chain/test-projects/TestRazorApp
dotnet run
```

The application will start on `http://localhost:5000` (or the port shown in console).

## Using with Clain Extension

1. Open this folder in VS Code
2. Run command: **Clain: Start Preview**
3. Select `TestRazorApp.csproj` from the QuickPick
4. The live preview panel will open
5. Click any element to navigate to its source
6. Edit any `.cshtml` file and save to see hot reload

## Test Scenarios

### Scenario 1: Basic Click Navigation
1. Click the "Clain Test App" header
2. Verify navigation to `_Header.cshtml`

### Scenario 2: Nested Element Navigation
1. Navigate to `/Home/Products`
2. Click a product card
3. Verify navigation to `_Card.cshtml`
4. Click the stock status text
5. Verify cursor position within conditional block

### Scenario 3: Hot Reload
1. Open `Views/Shared/_Header.cshtml`
2. Change background gradient colors
3. Save file
4. Verify preview updates without refresh

### Scenario 4: Breadcrumb Navigation
1. Click deeply nested element (e.g., stock status text)
2. Verify breadcrumb shows: Card → Product → Stock Status
3. Click breadcrumb level to select parent element

### Scenario 5: Property Panel
1. Select an element with inline styles
2. Verify property panel shows CSS properties
3. Edit a property value
4. Verify preview updates (future implementation)

## Notes

- All test data is hardcoded in the controller (no database)
- Inline styles are intentional for testing visibility
- `data-clain-src` attributes are added to all major UI elements
