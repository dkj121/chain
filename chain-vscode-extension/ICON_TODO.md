Icon Placeholder

For the extension to be published, a 128x128 PNG icon file should be placed at:
chain-vscode-extension/icon.png

The icon should:
- Be 128x128 pixels
- Have a transparent background
- Represent the Chain brand (chain link, design elements, or Razor-related imagery)
- Work well at small sizes (when displayed in the VS Code extensions list)

Current status: MISSING - needs to be created by a designer

Temporary solution for testing:
You can create a simple placeholder icon using ImageMagick or similar:
```bash
convert -size 128x128 xc:transparent -fill '#007bff' -draw "circle 64,64 64,16" icon.png
```

Or download a free icon from:
- https://www.flaticon.com/
- https://icons8.com/
- https://www.iconfinder.com/

Remember to check licensing for any icon used in production.
