using Clain.DesignTime.Common;

namespace Clain.DesignTime.Tests.Common;

public class EnvironmentDetectionTests
{
    [Fact]
    public void IsDesignTimeEnvironment_Development_ReturnsTrue()
    {
        Assert.True(EnvironmentDetection.IsDesignTimeEnvironment("Development"));
    }

    [Fact]
    public void IsDesignTimeEnvironment_ClainDesign_ReturnsTrue()
    {
        Assert.True(EnvironmentDetection.IsDesignTimeEnvironment("ClainDesign"));
    }

    [Fact]
    public void IsDesignTimeEnvironment_CaseInsensitive_ReturnsTrue()
    {
        Assert.True(EnvironmentDetection.IsDesignTimeEnvironment("DEVELOPMENT"));
        Assert.True(EnvironmentDetection.IsDesignTimeEnvironment("development"));
        Assert.True(EnvironmentDetection.IsDesignTimeEnvironment("claindesign"));
        Assert.True(EnvironmentDetection.IsDesignTimeEnvironment("CLAINDESIGN"));
    }

    [Fact]
    public void IsDesignTimeEnvironment_Production_ReturnsFalse()
    {
        Assert.False(EnvironmentDetection.IsDesignTimeEnvironment("Production"));
    }

    [Fact]
    public void IsDesignTimeEnvironment_Staging_ReturnsFalse()
    {
        Assert.False(EnvironmentDetection.IsDesignTimeEnvironment("Staging"));
    }

    [Fact]
    public void IsDesignTimeEnvironment_Null_ReturnsFalse()
    {
        Assert.False(EnvironmentDetection.IsDesignTimeEnvironment(null));
    }

    [Fact]
    public void IsDesignTimeEnvironment_Empty_ReturnsFalse()
    {
        Assert.False(EnvironmentDetection.IsDesignTimeEnvironment(""));
        Assert.False(EnvironmentDetection.IsDesignTimeEnvironment("   "));
    }

    [Fact]
    public void DesignTimeEnvironments_ContainsExpectedValues()
    {
        Assert.Contains("Development", EnvironmentDetection.DesignTimeEnvironments);
        Assert.Contains("ClainDesign", EnvironmentDetection.DesignTimeEnvironments);
        Assert.Equal(2, EnvironmentDetection.DesignTimeEnvironments.Length);
    }
}
