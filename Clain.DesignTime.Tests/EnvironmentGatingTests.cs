using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace Clain.DesignTime.Tests
{
    public class EnvironmentGatingTests
    {
        [Theory]
        [InlineData("Development")]
        [InlineData("ClainDesign")]
        public void Process_InjectsAttribute_InDesignTimeEnvironments(string environmentName)
        {
            var tagHelper = CreateTagHelper(environmentName);
            var context = CreateContextWithSourceSpan();
            var output = CreateOutput("div");

            tagHelper.Process(context, output);

            AttributeInjectionAssert.Emitted(output);
        }

        [Theory]
        [InlineData("Production")]
        [InlineData("Staging")]
        public void Process_DoesNotInjectAttribute_InNonDesignTimeEnvironments(string environmentName)
        {
            var tagHelper = CreateTagHelper(environmentName);
            var context = CreateContextWithSourceSpan();
            var output = CreateOutput("div");

            tagHelper.Process(context, output);

            AttributeInjectionAssert.NotEmitted(output);
        }

        [Fact]
        public void Process_DoesNotInjectAttribute_WhenEnvironmentIsNull()
        {
            var tagHelper = new ClainSourceTagHelper(hostEnvironment: null);
            var context = CreateContextWithSourceSpan();
            var output = CreateOutput("div");

            tagHelper.Process(context, output);

            AttributeInjectionAssert.NotEmitted(output);
        }

        [Fact]
        public void Process_EnvironmentCheckIsCaseInsensitive()
        {
            var tagHelper = CreateTagHelper("DEVELOPMENT");
            var context = CreateContextWithSourceSpan();
            var output = CreateOutput("div");

            tagHelper.Process(context, output);

            AttributeInjectionAssert.Emitted(output);
        }

        [Fact]
        public void IsDesignTimeEnvironment_ReturnsFalse_ForProduction()
        {
            var tagHelper = CreateTagHelper("Production");

            Assert.False(tagHelper.IsDesignTimeEnvironment());
        }

        [Fact]
        public void IsDesignTimeEnvironment_ReturnsTrue_ForClainDesign()
        {
            var tagHelper = CreateTagHelper("ClainDesign");

            Assert.True(tagHelper.IsDesignTimeEnvironment());
        }

        private static ClainSourceTagHelper CreateTagHelper(string environmentName)
        {
            return new ClainSourceTagHelper(new StubHostEnvironment(environmentName));
        }

        private static TagHelperContext CreateContextWithSourceSpan()
        {
            var items = new Dictionary<object, object>
            {
                ["RazorSourceSpan"] = new StubSourceSpan
                {
                    FilePath = "Views/Home/Index.cshtml",
                    LineIndex = 10,
                    CharacterIndex = 5
                }
            };

            return new TagHelperContext(
                new TagHelperAttributeList(),
                items,
                Guid.NewGuid().ToString());
        }

        private static TagHelperOutput CreateOutput(string tagName)
        {
            return new TagHelperOutput(
                tagName,
                new TagHelperAttributeList(),
                (useCachedResult, encoder) =>
                    Task.FromResult<TagHelperContent>(new DefaultTagHelperContent()));
        }

        private class StubSourceSpan
        {
            public string FilePath { get; set; } = string.Empty;
            public int LineIndex { get; set; }
            public int CharacterIndex { get; set; }
        }
    }
}
