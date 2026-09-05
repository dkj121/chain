using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Linq;
using System.Reflection;
using Clain.DesignTime.Blazor;

namespace Clain.DesignTime.Tests.SourceGenerator;

/// <summary>
/// Tests for the ClainBlazorSourceGenerator.
/// Phase 1: Verify the generator runs and produces output for simple components with divs.
/// </summary>
public class ClainBlazorSourceGeneratorTests
{
    [Fact]
    public void Generator_ProducesSource_ForSimpleComponentWithDiv()
    {
        // Arrange
        var razorSource = @"
@page ""/counter""

<h3>Counter</h3>
<div>Current count: @currentCount</div>

@code {
    private int currentCount = 0;
}
";

        // Act
        var (compilation, diagnostics) = RunGenerator(razorSource, "Counter.razor");

        // Assert
        Assert.Empty(diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error));

        var generatedSource = GetGeneratedSource(compilation, "Counter.Clain.g.cs");
        Assert.NotNull(generatedSource);
        Assert.Contains("public partial class Counter", generatedSource);
    }

    [Fact]
    public void Generator_SkipsFiles_WithoutDivElements()
    {
        // Arrange
        var razorSource = @"
@page ""/test""

<h3>No Divs Here</h3>

@code {
    private string title = ""Test"";
}
";

        // Act
        var (compilation, diagnostics) = RunGenerator(razorSource, "Test.razor");

        // Assert
        Assert.Empty(diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error));

        var generatedSource = GetGeneratedSource(compilation, "Test.Clain.g.cs");
        // Phase 1: Generator skips files without divs
        Assert.Null(generatedSource);
    }

    [Fact]
    public void Generator_IncludesConditionalCompilation_InGeneratedCode()
    {
        // Arrange
        var razorSource = @"
<div>Test content</div>
";

        // Act
        var (compilation, _) = RunGenerator(razorSource, "TestComponent.razor");

        // Assert
        var generatedSource = GetGeneratedSource(compilation, "TestComponent.Clain.g.cs");
        Assert.NotNull(generatedSource);
        Assert.Contains("#if DEBUG || CLAIN_DESIGN", generatedSource);
        Assert.Contains("#endif", generatedSource);
    }

    [Fact]
    public void Generator_IncludesNormalizedFilePath_InGeneratedCode()
    {
        // Arrange
        var razorSource = "<div>Test</div>";
        var filePath = @"C:\Project\Components\TestComponent.razor";

        // Act
        var (compilation, _) = RunGenerator(razorSource, filePath);

        // Assert
        var generatedSource = GetGeneratedSource(compilation, "TestComponent.Clain.g.cs");
        Assert.NotNull(generatedSource);

        // Path should be normalized to forward slashes
        Assert.Contains("C:/Project/Components/TestComponent.razor", generatedSource);
        Assert.DoesNotContain("\\", generatedSource.Split('\n').First(l => l.Contains("Source:")));
    }

    [Fact]
    public void Generator_CreatesPartialClass_WithCorrectComponentName()
    {
        // Arrange
        var razorSource = "<div>Counter content</div>";

        // Act
        var (compilation, _) = RunGenerator(razorSource, "Counter.razor");

        // Assert
        var generatedSource = GetGeneratedSource(compilation, "Counter.Clain.g.cs");
        Assert.NotNull(generatedSource);
        Assert.Contains("public partial class Counter", generatedSource);
    }

    [Fact]
    public void Generator_RegistersPostInitializationOutput()
    {
        // Arrange
        var razorSource = "<div>Test</div>";

        // Act
        var (compilation, _) = RunGenerator(razorSource, "Test.razor");

        // Assert
        var generatedFiles = compilation.SyntaxTrees
            .Select(t => System.IO.Path.GetFileName(t.FilePath))
            .ToList();

        Assert.Contains("ClainBlazorSourceGenerator.g.cs", generatedFiles);
    }

    private (Compilation, ImmutableArray<Diagnostic>) RunGenerator(string razorSource, string fileName)
    {
        // Create a compilation
        var compilation = CreateCompilation();

        // Create additional file for the .razor file
        var additionalFile = new InMemoryAdditionalText(fileName, razorSource);

        // Create the generator
        var generator = new ClainBlazorSourceGenerator();

        // Run the generator
        GeneratorDriver driver = CSharpGeneratorDriver.Create(generator);
        driver = driver.AddAdditionalTexts(ImmutableArray.Create<AdditionalText>(additionalFile));
        driver = driver.RunGeneratorsAndUpdateCompilation(compilation, out var outputCompilation, out var diagnostics);

        return (outputCompilation, diagnostics);
    }

    private Compilation CreateCompilation()
    {
        var references = new[]
        {
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(System.Runtime.AssemblyTargetedPatchBandAttribute).Assembly.Location),
            MetadataReference.CreateFromFile(Assembly.Load("System.Runtime").Location),
            MetadataReference.CreateFromFile(Assembly.Load("netstandard").Location),
        };

        return CSharpCompilation.Create(
            "TestAssembly",
            syntaxTrees: System.Array.Empty<SyntaxTree>(),
            references: references,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
    }

    private string? GetGeneratedSource(Compilation compilation, string fileName)
    {
        var tree = compilation.SyntaxTrees.FirstOrDefault(t => t.FilePath.EndsWith(fileName));
        return tree?.ToString();
    }

    /// <summary>
    /// In-memory implementation of AdditionalText for testing
    /// </summary>
    private class InMemoryAdditionalText : AdditionalText
    {
        private readonly SourceText _text;

        public InMemoryAdditionalText(string path, string text)
        {
            Path = path;
            _text = SourceText.From(text, System.Text.Encoding.UTF8);
        }

        public override string Path { get; }

        public override SourceText? GetText(System.Threading.CancellationToken cancellationToken = default)
        {
            return _text;
        }
    }
}
