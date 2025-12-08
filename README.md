# Snow Background for VS Code

Adds a beautiful animated snow effect to your VS Code editor.

## Features

- Customizable snow on different areas (editor, sidebar, panel, terminal)
- Adjustable speed, opacity, color, and wind direction
- Gentle wobbling motion for realistic snowfall
- Cursor interaction - snowflakes are pushed aside by your mouse
- WSL2 support

## Usage

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Snow Background: Enable"
3. Restart VS Code

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `snowBackground.areas` | Areas to show snow | `["editor"]` |
| `snowBackground.flakeCount` | Number of snowflakes | `100` |
| `snowBackground.speed` | Fall speed | `2` |
| `snowBackground.opacity` | Snow opacity | `0.6` |
| `snowBackground.wind` | Wind angle | `0.5` |
| `snowBackground.color` | RGB color | `255, 255, 255` |
| `snowBackground.cursorInteraction` | Enable cursor repulsion | `true` |
| `snowBackground.cursorRadius` | Cursor repulsion radius (px) | `60` |
| `snowBackground.cursorStrength` | Cursor repulsion strength | `1.0` |
| `snowBackground.windowsUsername` | Windows username (WSL) | Auto-detect |

## Important

**Before uninstalling this extension, you must disable it first** by running "Snow Background: Disable" from the Command Palette. This removes the injected code from VS Code. If you uninstall without disabling, the snow effect may persist or cause issues.

## Note

After enabling, VS Code will show a "corrupted" warning. This is harmless — click the gear icon and select "Don't Show Again".

## License

MIT License

Copyright (c) 2024 Tobias Hönel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
