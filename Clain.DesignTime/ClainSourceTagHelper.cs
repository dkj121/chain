using Microsoft.AspNetCore.Razor.TagHelpers;

namespace Clain.DesignTime
{
    /// <summary>
    /// Tag Helper that injects data-clain-src attributes with source location information
    /// </summary>
    [HtmlTargetElement("*")]
    public class ClainSourceTagHelper : TagHelper
    {
        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var sourceSpan = GetRazorSourceSpan(context);

            if (sourceSpan != null)
            {
                output.Attributes.Add("data-clain-src",
                    $"{sourceSpan.FilePath}:{sourceSpan.Line}:{sourceSpan.Character}");
            }
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
                return ParseSourceSpanFromObject(spanObj);
            }

            // Method 2: Check for source location metadata (alternative approach)
            if (context.Items.TryGetValue("SourceLocation", out var locationObj))
            {
                return ParseSourceLocationFromObject(locationObj);
            }

            // Method 3: Try to extract from tag name's diagnostic source (fallback)
            if (context.Items.TryGetValue(typeof(Microsoft.AspNetCore.Razor.TagHelpers.TagHelperAttribute).FullName!, out var attributeObj))
            {
                return ParseFromAttributeMetadata(attributeObj);
            }

            // Source span unavailable (dynamically generated elements)
            return null;
        }

        private SourceSpanInfo? ParseSourceSpanFromObject(object spanObj)
        {
            // Use reflection to extract source span information
            var type = spanObj.GetType();

            var filePathProp = type.GetProperty("FilePath");
            var lineProp = type.GetProperty("LineIndex") ?? type.GetProperty("Line");
            var charProp = type.GetProperty("CharacterIndex") ?? type.GetProperty("Character");

            if (filePathProp != null && lineProp != null && charProp != null)
            {
                return new SourceSpanInfo
                {
                    FilePath = filePathProp.GetValue(spanObj)?.ToString() ?? "",
                    Line = Convert.ToInt32(lineProp.GetValue(spanObj)),
                    Character = Convert.ToInt32(charProp.GetValue(spanObj))
                };
            }

            return null;
        }

        private SourceSpanInfo? ParseSourceLocationFromObject(object locationObj)
        {
            var type = locationObj.GetType();

            var filePathProp = type.GetProperty("FilePath");
            var lineIndexProp = type.GetProperty("LineIndex");
            var characterIndexProp = type.GetProperty("CharacterIndex");

            if (filePathProp != null && lineIndexProp != null && characterIndexProp != null)
            {
                return new SourceSpanInfo
                {
                    FilePath = filePathProp.GetValue(locationObj)?.ToString() ?? "",
                    Line = Convert.ToInt32(lineIndexProp.GetValue(locationObj)),
                    Character = Convert.ToInt32(characterIndexProp.GetValue(locationObj))
                };
            }

            return null;
        }

        private SourceSpanInfo? ParseFromAttributeMetadata(object attributeObj)
        {
            // This is a fallback mechanism for extracting source info from attribute metadata
            // Implementation depends on internal Razor structures
            return null;
        }
    }
}
