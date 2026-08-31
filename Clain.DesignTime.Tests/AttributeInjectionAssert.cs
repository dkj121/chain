using Microsoft.AspNetCore.Razor.TagHelpers;
using Xunit;

namespace Clain.DesignTime.Tests
{
    /// <summary>
    /// Assertions for the data-clain-src attribute.
    ///
    /// Injection is a Debug-only feature: Release builds strip it via #if DEBUG. A test
    /// that asserts the attribute is present is therefore only meaningful under Debug,
    /// and must assert its absence under Release. This helper holds that single
    /// conditional so individual tests stay free of #if directives.
    /// </summary>
    internal static class AttributeInjectionAssert
    {
        private const string AttributeName = "data-clain-src";

        /// <summary>
        /// Asserts the attribute was emitted — in Debug builds. In Release builds,
        /// asserts it was stripped instead.
        /// </summary>
        public static void Emitted(TagHelperOutput output)
        {
#if DEBUG
            Assert.Contains(output.Attributes, attr => attr.Name == AttributeName);
#else
            Assert.DoesNotContain(output.Attributes, attr => attr.Name == AttributeName);
#endif
        }

        /// <summary>
        /// Asserts the attribute was not emitted. Holds in every build configuration.
        /// </summary>
        public static void NotEmitted(TagHelperOutput output)
        {
            Assert.DoesNotContain(output.Attributes, attr => attr.Name == AttributeName);
        }

        /// <summary>
        /// Asserts the attribute's value — in Debug builds only, since Release emits nothing.
        /// </summary>
        public static void HasValue(TagHelperOutput output, string expected)
        {
#if DEBUG
            var attribute = output.Attributes.First(attr => attr.Name == AttributeName);
            Assert.Equal(expected, attribute.Value);
#else
            Assert.DoesNotContain(output.Attributes, attr => attr.Name == AttributeName);
#endif
        }
    }
}
