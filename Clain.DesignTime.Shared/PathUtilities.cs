using System;
using System.IO;

namespace Clain.DesignTime.Common
{
    /// <summary>
    /// File path manipulation utilities for normalizing and formatting source locations.
    /// </summary>
    public static class PathUtilities
    {
        /// <summary>
        /// Normalizes a file path to use forward slashes for consistency across platforms.
        /// </summary>
        /// <param name="path">The path to normalize</param>
        /// <returns>Path with forward slashes, or empty string if input is null/empty</returns>
        public static string NormalizePath(string? path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return string.Empty;
            }

            return path!.Replace('\\', '/');
        }

        /// <summary>
        /// Gets a relative path from a base directory to a target file.
        /// Falls back to the full path if relative path cannot be computed.
        /// </summary>
        /// <param name="basePath">The base directory path</param>
        /// <param name="targetPath">The target file path</param>
        /// <returns>Relative path if possible, otherwise full target path</returns>
        public static string GetRelativePath(string? basePath, string? targetPath)
        {
            if (string.IsNullOrWhiteSpace(basePath) || string.IsNullOrWhiteSpace(targetPath))
            {
                return targetPath ?? string.Empty;
            }

            try
            {
                var baseUri = new Uri(EnsureTrailingSlash(Path.GetFullPath(basePath)));
                var targetUri = new Uri(Path.GetFullPath(targetPath));

                if (baseUri.Scheme != targetUri.Scheme)
                {
                    return NormalizePath(targetPath);
                }

                var relativeUri = baseUri.MakeRelativeUri(targetUri);
                var relativePath = Uri.UnescapeDataString(relativeUri.ToString());

                return NormalizePath(relativePath);
            }
            catch
            {
                // Fall back to full path if relative path computation fails
                return NormalizePath(targetPath);
            }
        }

        private static string EnsureTrailingSlash(string path)
        {
            if (!path.EndsWith(Path.DirectorySeparatorChar.ToString()) &&
                !path.EndsWith(Path.AltDirectorySeparatorChar.ToString()))
            {
                return path + Path.DirectorySeparatorChar;
            }
            return path;
        }
    }
}
