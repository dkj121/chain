# Chain - AI-Driven Visual Design for ASP.NET Core Razor

Chain is an innovative VS Code extension that transforms how you build ASP.NET Core Razor applications by positioning code as the design language. It combines live preview, intelligent component discovery, and AI-powered design assistance to create a seamless development experience.

## Features

### 🎨 Live Preview with Click-to-Source
- Real-time rendering of your Razor views in an embedded preview panel
- Click any element in the preview to instantly jump to its source code
- Hot reload support keeps your preview synchronized with code changes

### 🔍 AI-Powered Component Discovery
- Natural language search to find or generate components
- Dynamic toolbox populated from your actual project codebase
- Drag-and-drop component insertion with intelligent placement

### ⚡ Visual Property Editor
- Edit HTML attributes and CSS properties through an intuitive properties panel
- Live code preview shows changes as you type
- Temporary inline styles with AI-powered consolidation

### 🎯 Smart Code Navigation
- Breadcrumb navigation shows component hierarchy and scope
- Scope-aware drag operations prevent invalid code generation
- AST-based understanding of Razor syntax and C# expressions

## Installation

### From VSIX File
1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Click the `...` menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

### From VS Code Marketplace
Search for "Chain" in the VS Code Extensions marketplace and click Install.

## Getting Started

1. **Initialize Chain in Your Project**
   - Open an ASP.NET Core Razor project in VS Code
   - Open Command Palette (Ctrl+Shift+P)
   - Run `Chain: Init Project`
   - This creates the `.chain/` directory and installs the `Chain.DesignTime` NuGet package

2. **Start Live Preview**
   - Open a Razor view file (`.cshtml`)
   - Run `Chain: Start Preview` from Command Palette
   - The preview panel will launch showing your rendered view

3. **Edit Visually**
   - Click elements in the preview to select them
   - Use the Properties panel to modify attributes
   - See changes reflected immediately in both preview and code

4. **Discover Components**
   - Open the Chain sidebar from the Activity Bar
   - Use the search box to find components with natural language
   - Drag components into your preview to insert them into code

## Commands

- `Chain: Start Preview` - Launch the live preview panel
- `Chain: Stop Preview` - Stop the preview server
- `Chain: Refresh Preview` - Manually refresh the preview
- `Chain: Show Properties` - Open the properties panel

## Requirements

- Visual Studio Code 1.85.0 or higher
- .NET 6.0 or higher
- ASP.NET Core project with Razor views

## Extension Settings

Chain contributes the following settings:

- `chain.previewPort` - Port for the Kestrel preview server (default: 5000)
- `chain.autoRefresh` - Automatically refresh preview on file save (default: true)

## Known Issues

- Tag Helper coverage does not extend to `@Html.Raw()` or legacy HtmlHelper outputs
- Preview requires successful Kestrel startup (database dependencies may block this)
- Drag-and-drop scope validation requires AST parsing, which may be slow for very large files

## Contributing

Chain is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See [CONTRIBUTING.md](https://github.com/yourusername/chain/blob/main/CONTRIBUTING.md) for detailed guidelines.

## Release Notes

### 0.1.0 (Initial Release)

- Live Razor preview with click-to-source mapping
- Properties panel for visual attribute editing
- Component toolbox with AI-powered search
- Style consolidation workflow
- Integration with Chain.DesignTime NuGet package

## License

This extension is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Support

- [Report Issues](https://github.com/yourusername/chain/issues)
- [Documentation](https://github.com/yourusername/chain/wiki)
- [Discussions](https://github.com/yourusername/chain/discussions)

---

**Enjoy building beautiful Razor applications with Chain!**
