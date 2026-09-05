using Microsoft.AspNetCore.Razor.TagHelpers;
using Clain.DesignTime.Common;
using Xunit;

namespace Clain.DesignTime.Tests.TagHelper
{
    public class ClainSourceTagHelperTests
    {
        [Fact]
        public void Process_AddsDataClainSrcAttribute_WhenSourceSpanAvailable()
        {
            // Arrange
            var tagHelper = new ClainSourceTagHelper(StubHostEnvironment.Development);
            var context = CreateTagHelperContext(withSourceSpan: true);
            var output = CreateTagHelperOutput("div");

            // Act
            tagHelper.Process(context, output);

            // Assert
            AttributeInjectionAssert.HasValue(output, "Views/Home/Index.cshtml:10:5");
        }

        [Fact]
        public void Process_DoesNotAddAttribute_WhenSourceSpanUnavailable()
        {
            // Arrange
            var tagHelper = new ClainSourceTagHelper(StubHostEnvironment.Development);
            var context = CreateTagHelperContext(withSourceSpan: false);
            var output = CreateTagHelperOutput("div");

            // Act
            tagHelper.Process(context, output);

            // Assert
            Assert.DoesNotContain(output.Attributes, attr => attr.Name == "data-clain-src");
        }

        [Fact]
        public void GetRazorSourceSpan_ReturnsNull_WhenContextItemsEmpty()
        {
            // Arrange
            var tagHelper = new ClainSourceTagHelper(StubHostEnvironment.Development);
            var context = new TagHelperContext(
                new TagHelperAttributeList(),
                new Dictionary<object, object>(),
                Guid.NewGuid().ToString());

            // Act
            var result = tagHelper.GetRazorSourceSpan(context);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public void GetRazorSourceSpan_ExtractsFilePath_WhenRazorSourceSpanPresent()
        {
            // Arrange
            var tagHelper = new ClainSourceTagHelper(StubHostEnvironment.Development);
            var mockSourceSpan = new MockRazorSourceSpan
            {
                FilePath = "Views/Home/Index.cshtml",
                LineIndex = 10,
                CharacterIndex = 5
            };
            var items = new Dictionary<object, object>
            {
                { "RazorSourceSpan", mockSourceSpan }
            };
            var context = new TagHelperContext(
                new TagHelperAttributeList(),
                items,
                Guid.NewGuid().ToString());

            // Act
            var result = tagHelper.GetRazorSourceSpan(context);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Views/Home/Index.cshtml", result.FilePath);
            Assert.Equal(10, result.Line);
            Assert.Equal(5, result.Character);
        }

        [Fact]
        public void GetRazorSourceSpan_ExtractsFromSourceLocation_WhenPresent()
        {
            // Arrange
            var tagHelper = new ClainSourceTagHelper(StubHostEnvironment.Development);
            var mockLocation = new MockSourceLocation
            {
                FilePath = "Views/Shared/_Layout.cshtml",
                LineIndex = 25,
                CharacterIndex = 12
            };
            var items = new Dictionary<object, object>
            {
                { "SourceLocation", mockLocation }
            };
            var context = new TagHelperContext(
                new TagHelperAttributeList(),
                items,
                Guid.NewGuid().ToString());

            // Act
            var result = tagHelper.GetRazorSourceSpan(context);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Views/Shared/_Layout.cshtml", result.FilePath);
            Assert.Equal(25, result.Line);
            Assert.Equal(12, result.Character);
        }

        [Fact]
        public void GetRazorSourceSpan_HandlesAlternativePropertyNames()
        {
            // Arrange
            var tagHelper = new ClainSourceTagHelper(StubHostEnvironment.Development);
            var mockSourceSpan = new MockRazorSourceSpanAlternative
            {
                FilePath = "Pages/Index.cshtml",
                Line = 15,
                Character = 8
            };
            var items = new Dictionary<object, object>
            {
                { "RazorSourceSpan", mockSourceSpan }
            };
            var context = new TagHelperContext(
                new TagHelperAttributeList(),
                items,
                Guid.NewGuid().ToString());

            // Act
            var result = tagHelper.GetRazorSourceSpan(context);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Pages/Index.cshtml", result.FilePath);
            Assert.Equal(15, result.Line);
            Assert.Equal(8, result.Character);
        }

        private TagHelperContext CreateTagHelperContext(bool withSourceSpan)
        {
            var items = new Dictionary<object, object>();

            if (withSourceSpan)
            {
                items["RazorSourceSpan"] = new MockRazorSourceSpan
                {
                    FilePath = "Views/Home/Index.cshtml",
                    LineIndex = 10,
                    CharacterIndex = 5
                };
            }

            return new TagHelperContext(
                new TagHelperAttributeList(),
                items,
                Guid.NewGuid().ToString());
        }

        private TagHelperOutput CreateTagHelperOutput(string tagName)
        {
            return new TagHelperOutput(
                tagName,
                new TagHelperAttributeList(),
                (useCachedResult, encoder) => Task.FromResult<TagHelperContent>(new DefaultTagHelperContent()));
        }

        // Mock classes to simulate Razor compiler source span structures
        private class MockRazorSourceSpan
        {
            public string FilePath { get; set; } = string.Empty;
            public int LineIndex { get; set; }
            public int CharacterIndex { get; set; }
        }

        private class MockRazorSourceSpanAlternative
        {
            public string FilePath { get; set; } = string.Empty;
            public int Line { get; set; }
            public int Character { get; set; }
        }

        private class MockSourceLocation
        {
            public string FilePath { get; set; } = string.Empty;
            public int LineIndex { get; set; }
            public int CharacterIndex { get; set; }
        }
    }
}
