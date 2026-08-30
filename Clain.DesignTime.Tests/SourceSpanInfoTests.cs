using Microsoft.AspNetCore.Razor.TagHelpers;
using Xunit;

namespace Clain.DesignTime.Tests
{
    public class SourceSpanInfoTests
    {
        [Fact]
        public void ToString_ReturnsFormattedString()
        {
            // Arrange
            var sourceSpan = new SourceSpanInfo
            {
                FilePath = "Views/Home/Index.cshtml",
                Line = 10,
                Character = 5
            };

            // Act
            var result = sourceSpan.ToString();

            // Assert
            Assert.Equal("Views/Home/Index.cshtml:10:5", result);
        }

        [Fact]
        public void FilePath_DefaultsToEmptyString()
        {
            // Arrange & Act
            var sourceSpan = new SourceSpanInfo();

            // Assert
            Assert.Equal(string.Empty, sourceSpan.FilePath);
        }

        [Fact]
        public void LineAndCharacter_DefaultToZero()
        {
            // Arrange & Act
            var sourceSpan = new SourceSpanInfo();

            // Assert
            Assert.Equal(0, sourceSpan.Line);
            Assert.Equal(0, sourceSpan.Character);
        }

        [Fact]
        public void Properties_CanBeSet()
        {
            // Arrange
            var sourceSpan = new SourceSpanInfo();

            // Act
            sourceSpan.FilePath = "Pages/Index.cshtml";
            sourceSpan.Line = 42;
            sourceSpan.Character = 15;

            // Assert
            Assert.Equal("Pages/Index.cshtml", sourceSpan.FilePath);
            Assert.Equal(42, sourceSpan.Line);
            Assert.Equal(15, sourceSpan.Character);
        }
    }
}
