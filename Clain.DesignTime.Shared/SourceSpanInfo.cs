namespace Clain.DesignTime.Common
{
    /// <summary>
    /// Represents source location information extracted from Razor compiler.
    /// Shared between Tag Helper and Blazor Source Generator implementations.
    /// </summary>
    public class SourceSpanInfo
    {
        /// <summary>
        /// The source file path (e.g., "Views/Home/Index.cshtml" or "Components/Counter.razor")
        /// </summary>
        public string FilePath { get; set; } = string.Empty;

        /// <summary>
        /// Zero-based line index in the source file
        /// </summary>
        public int Line { get; set; }

        /// <summary>
        /// Zero-based character index within the line
        /// </summary>
        public int Character { get; set; }

        /// <summary>
        /// Formats the source span as "file:line:char" for data-clain-src attribute
        /// </summary>
        public override string ToString()
        {
            return $"{FilePath}:{Line}:{Character}";
        }
    }
}
