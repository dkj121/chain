using System.Text.Json;

namespace Chain.DesignTime;

/// <summary>
/// Middleware that injects mock data from mock-data.json when running in ChainDesign environment.
/// </summary>
public class MockDataMiddleware
{
    private readonly string _mockDataPath;
    private JsonDocument? _mockDataDocument;
    private readonly Dictionary<string, JsonElement> _mockDataCache = new();
    private bool _isLoaded;

    public event Action<string>? OnWarning;

    public MockDataMiddleware(string mockDataPath)
    {
        _mockDataPath = mockDataPath;
        LoadMockData();
    }

    private void LoadMockData()
    {
        try
        {
            if (!File.Exists(_mockDataPath))
            {
                LogWarning($"Mock data file not found: {_mockDataPath}");
                _isLoaded = false;
                return;
            }

            var jsonContent = File.ReadAllText(_mockDataPath);
            _mockDataDocument = JsonDocument.Parse(jsonContent);
            _isLoaded = true;

            // Cache models for faster lookup
            if (_mockDataDocument.RootElement.TryGetProperty("models", out var models))
            {
                foreach (var model in models.EnumerateObject())
                {
                    _mockDataCache[model.Name] = model.Value;
                }
            }
        }
        catch (Exception ex)
        {
            LogWarning($"Failed to load mock data: {ex.Message}");
            _isLoaded = false;
        }
    }

    public bool IsEnabled(string environmentName)
    {
        return environmentName?.Equals("ChainDesign", StringComparison.OrdinalIgnoreCase) == true;
    }

    public bool IsMockModeEnabled()
    {
        if (!_isLoaded || _mockDataDocument == null)
        {
            return false;
        }

        try
        {
            if (_mockDataDocument.RootElement.TryGetProperty("globalSettings", out var settings))
            {
                if (settings.TryGetProperty("dataMode", out var dataMode))
                {
                    return dataMode.GetString()?.Equals("mock", StringComparison.OrdinalIgnoreCase) == true;
                }
            }
        }
        catch
        {
            // If parsing fails, default to false
        }

        return true; // Default to mock mode if not specified
    }

    public JsonElement? GetMockDataForType(string viewModelType)
    {
        if (!_isLoaded || string.IsNullOrEmpty(viewModelType))
        {
            return null;
        }

        if (_mockDataCache.TryGetValue(viewModelType, out var modelData))
        {
            if (modelData.TryGetProperty("data", out var data))
            {
                return data;
            }
        }

        LogWarning($"Mock data not found for ViewModel type: {viewModelType}");
        return null;
    }

    public object? ReplaceWithMockData(object originalViewModel, string viewModelType)
    {
        if (!IsMockModeEnabled())
        {
            return originalViewModel;
        }

        var mockData = GetMockDataForType(viewModelType);
        if (mockData == null)
        {
            return originalViewModel; // Fallback to original
        }

        try
        {
            // Deserialize mock data as dynamic object
            var mockObject = JsonSerializer.Deserialize<object>(mockData.Value.GetRawText());
            return mockObject ?? originalViewModel;
        }
        catch (Exception ex)
        {
            LogWarning($"Failed to deserialize mock data for {viewModelType}: {ex.Message}");
            return originalViewModel;
        }
    }

    private void LogWarning(string message)
    {
        OnWarning?.Invoke(message);
        // Also write to console for debugging
        Console.WriteLine($"[Chain.DesignTime] WARNING: {message}");
    }

    public void Dispose()
    {
        _mockDataDocument?.Dispose();
        _mockDataCache.Clear();
    }
}
