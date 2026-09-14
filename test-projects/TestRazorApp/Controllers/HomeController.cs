using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TestRazorApp.Models;

namespace TestRazorApp.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        var viewModel = new HomeViewModel
        {
            Title = "Welcome to Clain Test App",
            WelcomeMessage = "This is a test application for Clain VS Code Extension",
            Features = new List<string>
            {
                "Live Preview with Hot Reload",
                "Click-to-Navigate to Source",
                "Property Panel Editing",
                "Breadcrumb Navigation",
                "Component Toolbox"
            },
            VisitorCount = 1234
        };
        return View(viewModel);
    }

    public IActionResult Products()
    {
        var products = new List<Product>
        {
            new() { Id = 1, Name = "Laptop", Description = "High-performance laptop", Price = 999.99m, Category = "Electronics", InStock = true, StockQuantity = 15 },
            new() { Id = 2, Name = "Mouse", Description = "Wireless ergonomic mouse", Price = 29.99m, Category = "Electronics", InStock = true, StockQuantity = 50 },
            new() { Id = 3, Name = "Desk Chair", Description = "Comfortable office chair", Price = 199.99m, Category = "Furniture", InStock = true, StockQuantity = 8 },
            new() { Id = 4, Name = "Monitor", Description = "27-inch 4K display", Price = 449.99m, Category = "Electronics", InStock = false, StockQuantity = 0 },
            new() { Id = 5, Name = "Keyboard", Description = "Mechanical keyboard", Price = 79.99m, Category = "Electronics", InStock = true, StockQuantity = 25 },
            new() { Id = 6, Name = "Desk Lamp", Description = "LED desk lamp", Price = 39.99m, Category = "Furniture", InStock = true, StockQuantity = 12 }
        };

        var viewModel = new ProductListViewModel
        {
            PageTitle = "Product Catalog",
            Products = products,
            Categories = products.Select(p => p.Category).Distinct().OrderBy(c => c).ToList(),
            TotalProducts = products.Count
        };

        return View(viewModel);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
