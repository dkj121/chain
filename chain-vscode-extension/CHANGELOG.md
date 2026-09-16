# Change Log

All notable changes to the Chain extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Advanced drag-and-drop component insertion
- Canvas view for multi-page layout
- Design token visual editor
- React and Vue framework support
- Collaboration features

## [0.1.0] - 2026-09-16

### Added
- Initial release of Chain extension
- Live Razor preview panel with embedded Kestrel server
- Click-to-source mapping via `data-chain-src` attributes
- Properties panel for visual attribute editing
- Component toolbox with project-based discovery
- AI-powered component search capability
- Mock data generation from ViewModels
- Data mode switching (mock vs. real backend)
- Style consolidation workflow for inline styles
- Integration with Chain.DesignTime NuGet package
- Breadcrumb navigation showing component hierarchy
- Hot reload support for Razor views
- Unit and integration test coverage
- Project initialization command (`Chain: Init Project`)
- Codebase analysis command (`Chain: Analyze Codebase`)

### Technical Details
- VS Code Extension API integration
- TypeScript implementation with strict type checking
- ASP.NET Core Kestrel process management
- Custom Razor Tag Helper for source mapping
- WebView-based preview rendering
- File system watching for hot reload
- Mock data middleware for development mode

### Known Limitations
- Tag Helper coverage does not extend to `@Html.Raw()` outputs
- Preview requires successful Kestrel startup
- Scope validation may be slow for very large Razor files
- Icon is placeholder SVG (needs proper branding)

[Unreleased]: https://github.com/yourusername/chain/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/chain/releases/tag/v0.1.0
