using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Clain.DesignTime.Tests
{
    /// <summary>
    /// Test double for IHostEnvironment, letting tests choose the environment name.
    /// </summary>
    internal class StubHostEnvironment : IHostEnvironment
    {
        public StubHostEnvironment(string environmentName)
        {
            EnvironmentName = environmentName;
        }

        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "TestApp";
        public string ContentRootPath { get; set; } = "/test";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();

        /// <summary>
        /// A design-time environment, for tests whose subject is not the environment gate itself.
        /// </summary>
        public static StubHostEnvironment Development => new StubHostEnvironment("Development");
    }
}
