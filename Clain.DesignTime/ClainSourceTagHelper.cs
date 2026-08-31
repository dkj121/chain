using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Hosting;

namespace Clain.DesignTime
{
    /// <summary>
    /// Tag Helper that injects data-clain-src attributes with source location information.
    /// Attributes are only emitted in design-time environments; in Release builds the
    /// injection is removed entirely by conditional compilation.
    /// </summary>
    [HtmlTargetElement("*")]
    public class ClainSourceTagHelper : TagHelper
    {
        /// <summary>
        /// Environment names in which source mapping attributes are emitted.
        /// </summary>
        public static readonly string[] DesignTimeEnvironments = { "Development", "ClainDesign" };

        private readonly IHostEnvironment? _hostEnvironment;

        public ClainSourceTagHelper(IHostEnvironment? hostEnvironment)
        {
            _hostEnvironment = hostEnvironment;
        }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
#if DEBUG
            if (!IsDesignTimeEnvironment())
            {
                return;
            }

            var sourceSpan = GetRazorSourceSpan(context);

            if (sourceSpan != null)
            {
                output.Attributes.Add("data-clain-src",
                    $"{sourceSpan.FilePath}:{sourceSpan.Line}:{sourceSpan.Character}");
            }
#endif
        }

        /// <summary>
        /// Determines whether the current host environment is a design-time environment.
        /// Returns false when no environment is available, so production hosts that do not
        /// register IHostEnvironment never receive attributes.
        /// </summary>
        public bool IsDesignTimeEnvironment()
        {
            if (_hostEnvironment == null)
            {
                return false;
            }

            return DesignTimeEnvironments.Contains(
                _hostEnvironment.EnvironmentName,
                StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Extracts source span information from Razor compiler context
        /// </summary>
        /// <param name="context">Tag Helper context containing Razor metadata</param>
        /// <returns>Source span info or null if unavailable</returns>
        public SourceSpanInfo? GetRazorSourceSpan(TagHelperContext context)
        {
            // Try to get source location from context items
            // The Razor compiler provides source information through various mechanisms

            // Method 1: Check for RazorSourceSpan in context items (standard approach)
            if (context.Items.TryGetValue("RazorSourceSpan", out var spanObj))
            {
                return ExtractSourceSpanUsingReflection(spanObj, "LineIndex", "CharacterIndex");
            }

            // Method 2: Check for source location metadata (alternative approach)
            if (context.Items.TryGetValue("SourceLocation", out var locationObj))
            {
                return ExtractSourceSpanUsingReflection(locationObj, "LineIndex", "CharacterIndex");
            }

            // Source span unavailable (dynamically generated elements)
            return null;
        }

        /// <summary>
        /// Extracts source span information from an object using reflection
        /// </summary>
        /// <param name="sourceObj">Object containing source span information</param>
        /// <param name="linePropertyName">Primary name for line property</param>
        /// <param name="charPropertyName">Primary name for character property</param>
        /// <returns>Extracted SourceSpanInfo or null if properties not found</returns>
        private SourceSpanInfo? ExtractSourceSpanUsingReflection(
            object sourceObj,
            string linePropertyName,
            string charPropertyName)
        {
            var type = sourceObj.GetType();

            var filePathProp = type.GetProperty("FilePath");
            var lineProp = type.GetProperty(linePropertyName) ?? type.GetProperty("Line");
            var charProp = type.GetProperty(charPropertyName) ?? type.GetProperty("Character");

            if (filePathProp != null && lineProp != null && charProp != null)
            {
                return new SourceSpanInfo
                {
                    FilePath = filePathProp.GetValue(sourceObj)?.ToString() ?? "",
                    Line = Convert.ToInt32(lineProp.GetValue(sourceObj)),
                    Character = Convert.ToInt32(charProp.GetValue(sourceObj))
                };
            }

            return null;
        }
    }
}
