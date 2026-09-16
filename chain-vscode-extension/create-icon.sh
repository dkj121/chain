#!/bin/bash
# Convert icon.svg to icon.png for VS Code extension

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    convert -background none -size 128x128 icon.svg icon.png
    echo "Icon converted to PNG successfully"
elif command -v inkscape &> /dev/null; then
    inkscape --export-type=png --export-width=128 --export-height=128 --export-filename=icon.png icon.svg
    echo "Icon converted to PNG using Inkscape"
elif command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 128 -h 128 icon.svg -o icon.png
    echo "Icon converted to PNG using rsvg-convert"
else
    echo "ERROR: No SVG to PNG converter found."
    echo "Please install one of: ImageMagick, Inkscape, or librsvg"
    echo ""
    echo "Install options:"
    echo "  sudo pacman -S imagemagick    # Arch Linux"
    echo "  sudo apt install imagemagick  # Ubuntu/Debian"
    echo "  sudo yum install ImageMagick  # RHEL/CentOS"
    echo ""
    echo "Or convert online at: https://cloudconvert.com/svg-to-png"
    exit 1
fi
