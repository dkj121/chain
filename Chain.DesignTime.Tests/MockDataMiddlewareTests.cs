using Xunit;
using Chain.DesignTime;
using System.Text.Json;

namespace Chain.DesignTime.Tests;

public class MockDataMiddlewareTests
{
    private const string MockDataJson = @"{
        ""models"": {
            ""TestApp.Models.HomeViewModel"": {
                ""meta"": {
                    ""source"": ""Controllers/HomeController.cs:10"",
                    ""consumedBy"": [""Views/Home/Index.cshtml:1""]
                },
                ""data"": {
                    ""Title"": ""Mock Home Page"",
                    ""Message"": ""This is mock data""
                }
            }
        },
        ""globalSettings"": {
            ""dataMode"": ""mock"",
            ""fallbackToMockOnError"": true
        }
    }";

    [Fact]
    public void Should_Load_Mock_Data_From_Json()
    {
        // Arrange
        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, MockDataJson);

        try
        {
            // Act
            var middleware = new MockDataMiddleware(mockDataPath);
            var mockData = middleware.GetMockDataForType("TestApp.Models.HomeViewModel");

            // Assert
            Assert.NotNull(mockData);
            Assert.True(mockData.HasValue);
            var title = mockData.Value.GetProperty("Title").GetString();
            Assert.Equal("Mock Home Page", title);
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }

    [Fact]
    public void Should_Only_Activate_In_ChainDesign_Environment()
    {
        // Arrange
        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, MockDataJson);

        try
        {
            var middleware = new MockDataMiddleware(mockDataPath);

            // Act & Assert - ChainDesign environment
            Assert.True(middleware.IsEnabled("ChainDesign"));

            // Act & Assert - Development environment
            Assert.False(middleware.IsEnabled("Development"));

            // Act & Assert - Production environment
            Assert.False(middleware.IsEnabled("Production"));
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }

    [Fact]
    public void Should_Replace_ViewModel_With_Mock_Data()
    {
        // Arrange
        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, MockDataJson);

        try
        {
            var middleware = new MockDataMiddleware(mockDataPath);

            var originalViewModel = new { Title = "Original", Message = "Original message" };
            var viewModelType = "TestApp.Models.HomeViewModel";

            // Act
            var replacedViewModel = middleware.ReplaceWithMockData(originalViewModel, viewModelType);

            // Assert
            Assert.NotNull(replacedViewModel);
            var json = JsonSerializer.Serialize(replacedViewModel);
            Assert.Contains("Mock Home Page", json);
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }

    [Fact]
    public void Should_Fallback_To_Original_Data_When_Mock_Not_Found()
    {
        // Arrange
        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, MockDataJson);

        try
        {
            var middleware = new MockDataMiddleware(mockDataPath);

            var originalViewModel = new { Title = "Original", Message = "Original message" };
            var viewModelType = "NonExistent.ViewModel";

            // Act
            var result = middleware.ReplaceWithMockData(originalViewModel, viewModelType);

            // Assert - Should return original when mock not found
            Assert.Equal(originalViewModel, result);
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }

    [Fact]
    public void Should_Handle_Missing_Mock_Data_File_Gracefully()
    {
        // Arrange
        var nonExistentPath = Path.Combine(Path.GetTempPath(), $"nonexistent-{Guid.NewGuid()}.json");

        // Act & Assert - Should not throw
        var middleware = new MockDataMiddleware(nonExistentPath);
        var mockData = middleware.GetMockDataForType("TestApp.Models.HomeViewModel");

        Assert.Null(mockData);
    }

    [Fact]
    public void Should_Match_ViewModel_Type_From_Model_Directive()
    {
        // Arrange
        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, MockDataJson);

        try
        {
            var middleware = new MockDataMiddleware(mockDataPath);

            // Act - Various type name formats
            var fullName = middleware.GetMockDataForType("TestApp.Models.HomeViewModel");
            var withNamespace = middleware.GetMockDataForType("TestApp.Models.HomeViewModel");

            // Assert
            Assert.NotNull(fullName);
            Assert.NotNull(withNamespace);
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }

    [Fact]
    public void Should_Log_Warning_When_Mock_Data_Missing()
    {
        // Arrange
        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, MockDataJson);

        try
        {
            var middleware = new MockDataMiddleware(mockDataPath);
            var warnings = new List<string>();
            middleware.OnWarning += (message) => warnings.Add(message);

            // Act
            middleware.GetMockDataForType("NonExistent.ViewModel");

            // Assert
            Assert.Contains(warnings, w => w.Contains("NonExistent.ViewModel"));
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }

    [Fact]
    public void Should_Respect_DataMode_Setting()
    {
        // Arrange - dataMode: "backend"
        var backendModeJson = @"{
            ""models"": {},
            ""globalSettings"": {
                ""dataMode"": ""backend""
            }
        }";

        var mockDataPath = Path.Combine(Path.GetTempPath(), $"mock-data-{Guid.NewGuid()}.json");
        File.WriteAllText(mockDataPath, backendModeJson);

        try
        {
            var middleware = new MockDataMiddleware(mockDataPath);

            // Act & Assert
            Assert.False(middleware.IsMockModeEnabled());
        }
        finally
        {
            File.Delete(mockDataPath);
        }
    }
}
