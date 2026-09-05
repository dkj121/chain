using Clain.DesignTime.Common;

namespace Clain.DesignTime.Tests.Common;

public class PathUtilitiesTests
{
    [Fact]
    public void NormalizePath_WithBackslashes_ReturnsForwardSlashes()
    {
        var result = PathUtilities.NormalizePath(@"C:\Users\Test\Project\file.razor");
        Assert.Equal("C:/Users/Test/Project/file.razor", result);
    }

    [Fact]
    public void NormalizePath_WithForwardSlashes_RemainsUnchanged()
    {
        var result = PathUtilities.NormalizePath("C:/Users/Test/Project/file.razor");
        Assert.Equal("C:/Users/Test/Project/file.razor", result);
    }

    [Fact]
    public void NormalizePath_WithMixedSlashes_NormalizesToForward()
    {
        var result = PathUtilities.NormalizePath(@"C:\Users/Test\Project/file.razor");
        Assert.Equal("C:/Users/Test/Project/file.razor", result);
    }

    [Fact]
    public void NormalizePath_Null_ReturnsEmpty()
    {
        var result = PathUtilities.NormalizePath(null);
        Assert.Equal(string.Empty, result);
    }

    [Fact]
    public void NormalizePath_Empty_ReturnsEmpty()
    {
        var result = PathUtilities.NormalizePath("");
        Assert.Equal(string.Empty, result);
    }

    [Fact]
    public void NormalizePath_Whitespace_ReturnsEmpty()
    {
        var result = PathUtilities.NormalizePath("   ");
        Assert.Equal(string.Empty, result);
    }

    [Fact]
    public void GetRelativePath_SameDirectory_ReturnsFilename()
    {
        var basePath = "/home/user/project";
        var targetPath = "/home/user/project/file.razor";

        var result = PathUtilities.GetRelativePath(basePath, targetPath);
        Assert.Equal("file.razor", result);
    }

    [Fact]
    public void GetRelativePath_Subdirectory_ReturnsRelativePath()
    {
        var basePath = "/home/user/project";
        var targetPath = "/home/user/project/Components/Counter.razor";

        var result = PathUtilities.GetRelativePath(basePath, targetPath);
        Assert.Equal("Components/Counter.razor", result);
    }

    [Fact]
    public void GetRelativePath_ParentDirectory_ReturnsRelativePathWithDotDot()
    {
        var basePath = "/home/user/project/subfolder";
        var targetPath = "/home/user/project/file.razor";

        var result = PathUtilities.GetRelativePath(basePath, targetPath);
        Assert.Contains("..", result);
    }

    [Fact]
    public void GetRelativePath_NullBase_ReturnsTargetPath()
    {
        var result = PathUtilities.GetRelativePath(null, "/home/user/file.razor");
        Assert.Equal("/home/user/file.razor", result);
    }

    [Fact]
    public void GetRelativePath_NullTarget_ReturnsEmpty()
    {
        var result = PathUtilities.GetRelativePath("/home/user/project", null);
        Assert.Equal(string.Empty, result);
    }

    [Fact]
    public void GetRelativePath_NormalizesSlashes()
    {
        var basePath = @"C:\Users\Test\Project";
        var targetPath = @"C:\Users\Test\Project\Components\Counter.razor";

        var result = PathUtilities.GetRelativePath(basePath, targetPath);

        // Result should use forward slashes
        Assert.DoesNotContain("\\", result);
        Assert.Contains("/", result);
    }
}
