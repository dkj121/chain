using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using Xunit;

namespace TestRazorApp.IntegrationTests;

public class HomeControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public HomeControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Index_ReturnsSuccessAndCorrectContentType()
    {
        // Act
        var response = await _client.GetAsync("/");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal("text/html; charset=utf-8", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task Index_ContainsExpectedTitle()
    {
        // Act
        var response = await _client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Welcome to Clain Test App", content);
    }

    [Fact]
    public async Task Index_ContainsDataClainSrcAttributes()
    {
        // Act
        var response = await _client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("data-clain-src=\"Views/Shared/_Header.cshtml\"", content);
        Assert.Contains("data-clain-src=\"Views/Shared/_Footer.cshtml\"", content);
    }

    [Fact]
    public async Task Index_ContainsFeaturesList()
    {
        // Act
        var response = await _client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Live Preview with Hot Reload", content);
        Assert.Contains("Click-to-Navigate to Source", content);
        Assert.Contains("Property Panel Editing", content);
    }

    [Fact]
    public async Task Index_ContainsVisitorCount()
    {
        // Act
        var response = await _client.GetAsync("/");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("1234", content);
        Assert.Contains("Total Visitors", content);
    }

    [Fact]
    public async Task Products_ReturnsSuccessAndCorrectContentType()
    {
        // Act
        var response = await _client.GetAsync("/Home/Products");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal("text/html; charset=utf-8", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task Products_ContainsProductGrid()
    {
        // Act
        var response = await _client.GetAsync("/Home/Products");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Product Catalog", content);
        Assert.Contains("Laptop", content);
        Assert.Contains("Mouse", content);
        Assert.Contains("Desk Chair", content);
    }

    [Fact]
    public async Task Products_ContainsCardPartialWithDataClainSrc()
    {
        // Act
        var response = await _client.GetAsync("/Home/Products");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("data-clain-src=\"Views/Shared/_Card.cshtml\"", content);
    }

    [Fact]
    public async Task Products_ContainsCategoryBadges()
    {
        // Act
        var response = await _client.GetAsync("/Home/Products");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Electronics", content);
        Assert.Contains("Furniture", content);
        Assert.Contains("class=\"category-badge\"", content);
    }

    [Fact]
    public async Task Products_ContainsStockStatus()
    {
        // Act
        var response = await _client.GetAsync("/Home/Products");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("In Stock", content);
        Assert.Contains("Out of Stock", content);
    }

    [Fact]
    public async Task Products_ContainsNestedConditionalSection()
    {
        // Act
        var response = await _client.GetAsync("/Home/Products");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("Stock Summary by Category", content);
    }

    [Fact]
    public async Task Privacy_ReturnsSuccess()
    {
        // Act
        var response = await _client.GetAsync("/Home/Privacy");

        // Assert
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task NonExistentRoute_Returns404()
    {
        // Act
        var response = await _client.GetAsync("/NonExistent");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
