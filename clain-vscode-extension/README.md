# Clain VS Code Extension

AI-driven visual design tool for ASP.NET Core Razor applications.

## Features

- **Live Preview**: See your Razor views rendered in real-time
- **Click-to-Locate**: Click any element in the preview to jump to its source code
- **Properties Panel**: Edit element attributes visually
- **AI Component Discovery**: Search and insert components using natural language
- **Hot Reload**: See changes instantly without manual refresh

## Getting Started

1. Open an ASP.NET Core project in VS Code
2. Run command: `Clain: Start Preview` (Ctrl+Shift+P)
3. If multiple .csproj files are found, select the web project to preview
4. Click any element in the preview to navigate to its source

## Development

### Build

```bash
npm install
npm run compile
```

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run watch
```

## Requirements

- VS Code ^1.85.0
- .NET 6.0 or higher
- ASP.NET Core project with Razor views

## Release Notes

### 0.1.0

- Initial MVP release
- Basic preview functionality
- Extension skeleton and webview foundation
