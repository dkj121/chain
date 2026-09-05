using System;

namespace Clain.DesignTime.Common
{
    /// <summary>
    /// Environment detection utilities for determining when to emit design-time attributes.
    /// Shared logic for both Tag Helper (runtime) and Source Generator (compile-time) scenarios.
    /// </summary>
    public static class EnvironmentDetection
    {
        /// <summary>
        /// Environment names in which source mapping attributes should be emitted.
        /// </summary>
        public static readonly string[] DesignTimeEnvironments = { "Development", "ClainDesign" };

        /// <summary>
        /// Checks if the given environment name is a design-time environment.
        /// Comparison is case-insensitive.
        /// </summary>
        /// <param name="environmentName">The environment name to check (e.g., "Development", "Production")</param>
        /// <returns>True if the environment is Development or ClainDesign, false otherwise</returns>
        public static bool IsDesignTimeEnvironment(string? environmentName)
        {
            if (string.IsNullOrWhiteSpace(environmentName))
            {
                return false;
            }

            foreach (var designEnv in DesignTimeEnvironments)
            {
                if (string.Equals(environmentName, designEnv, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
