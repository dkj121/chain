namespace Clain.DesignTime
{
    /// <summary>
    /// Represents source location information extracted from Razor compiler
    /// </summary>
    public class SourceSpanInfo
    {
        /// <summary>
        /// The source file path (e.g., "Views/Home/Index.cshtml")
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

        public override string ToString()
        {
            return $"{FilePath}:{Line}:{Character}";
        }
    }
}
