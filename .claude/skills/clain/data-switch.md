---
name: clain:data-switch
description: Toggle between mock data and real backend data modes during design-time preview. Use this skill when the user runs "Clain Data Switch" command, needs to preview UI with mock data versus real backend, is testing how UI handles different data states, or is switching between design mode and live data validation. Updates mock-data.json globalSettings to switch data sources without modifying application code.
---

# Context

**Importers/Callers:** VS Code extension command `clain.dataSwitch`, invoked from Command Palette or status bar. Referenced in `.clain/docs/data-switch.md` documentation.

**Affected API:** Reads/writes `.clain/mock-data.json` file, specifically the `globalSettings` object. Does not modify application code or Controllers.

**Data Schema:** Updates JSON structure in mock-data.json:
- `globalSettings.dataMode`: string enum ("mock" | "backend")
- `globalSettings.fallbackToMockOnError`: boolean
- `globalSettings.mockDelay`: number (milliseconds)

**User's instruction:** Build Claude Code skills matching the documentation in `.clain/docs/` — this skill implements the data-switch.md specification for toggling between mock and backend data modes during preview.

---

# Clain Data Mode Switcher

Toggle between mock data and real backend data during design-time preview, enabling designers to work without backend dependencies while developers can validate against live data.

## What this skill does

1. Reads current data mode from `mock-data.json`
2. Presents mode selection UI in VS Code
3. Updates `globalSettings.dataMode` in mock-data.json
4. Optionally configures fallback behavior
5. Optionally sets mock delay for latency simulation
6. Reloads preview if Kestrel server is running

## Prerequisites

- `.clain/mock-data.json` exists (run `clain:generate-mock-data` first)
- Kestrel preview server is running (optional, but switch takes effect on next reload)

## Switching Steps

### 1. Read Current Data Mode

Load `.clain/mock-data.json` and check `globalSettings.dataMode`:
- `"mock"` → Currently using mock data from mock-data.json
- `"backend"` → Currently using real backend data from Controllers

### 2. Show Mode Selection UI

Present VS Code QuickPick with options:
```
> Mock Data (Current)
  Real Backend Data
  
Description:
Mock: Use generated data from mock-data.json
Backend: Connect to real Controllers/APIs and database
```

Indicate current mode with "(Current)" suffix so users know the active state.

### 3. Update globalSettings

When user selects a mode, update `.clain/mock-data.json`:

**Switch to mock:**
```json
{
  "globalSettings": {
    "dataMode": "mock",
    "fallbackToMockOnError": true,
    "mockDelay": 0
  }
}
```

**Switch to backend:**
```json
{
  "globalSettings": {
    "dataMode": "backend",
    "fallbackToMockOnError": true,
    "mockDelay": 0
  }
}
```

Preserve all other fields in mock-data.json unchanged (the `models` section, `version`, etc.).

### 4. Reload Preview (if running)

If Kestrel preview is active:
- Send reload command to webview iframe to apply changes immediately
- OR show VS Code notification: "Data mode changed. Reload preview to apply."

If preview not running:
- Show notification: "Data mode changed to [Mock Data / Real Backend]. Start preview to see changes."

### 5. Optional: Adjust Fallback Behavior

Ask user if they want to configure fallback behavior when backend fails:
```
When backend fails or is unavailable, should Clain fall back to mock data?
> Yes (Recommended for development)
  No (Show errors instead)
```

Update `fallbackToMockOnError` based on selection:
- `true` → Gracefully fall back to mock data on backend errors (useful during development)
- `false` → Show error messages when backend fails (useful for debugging backend issues)

### 6. Optional: Configure Mock Delay

For mock mode, ask if user wants to simulate network latency:
```
Simulate network delay for mock data?
> No delay (instant)
  250ms (fast network)
  500ms (typical network)
  1000ms (slow network)
  Custom...
```

Update `mockDelay` value in milliseconds:
- `0` → Instant (no delay)
- `250` → Fast network simulation
- `500` → Typical network latency
- `1000` → Slow network simulation
- Custom value if "Custom..." selected

This helps test loading states and skeleton UIs during design.

## Completion Report

Show VS Code information message:
```
✓ Data mode switched to: Mock Data
  Fallback enabled: Yes
  Mock delay: 0ms
  
Preview will reload on next refresh.
```

Or:
```
✓ Data mode switched to: Real Backend
  Fallback enabled: Yes (will use mock data on errors)
  
Preview will reload on next refresh.
```

## Error Handling

- **mock-data.json missing**: Show error suggesting to run `clain:generate-mock-data` first
- **Invalid JSON structure**: Show error with parse details, offer to regenerate file
- **Preview reload fails**: Show warning, suggest manual refresh (F5 in webview or restart preview)
- **Cannot write to mock-data.json**: Check file permissions, show error with path

## Use Cases

**Designer workflow:**
- Switch to mock mode
- Work on UI layouts and styling without backend running
- Mock data provides consistent, realistic content for design decisions

**Developer workflow:**
- Switch to backend mode
- Validate that UI correctly handles real data
- Test edge cases and actual database content
- Debug Controller → View data flow

**QA/Testing workflow:**
- Toggle between modes to compare behavior
- Verify UI handles both mock and real data correctly
- Test loading states with mock delay enabled

## Important Notes

- This skill only updates configuration — it doesn't generate or modify data
- Changes take effect on next preview refresh (hot reload if supported by .NET runtime)
- Backend mode requires Controllers to return proper ViewModels as expected
- Mock mode reads data from the `models` section of mock-data.json
- `fallbackToMockOnError: true` is useful during development when backend is partially implemented
- `mockDelay` only affects mock mode — backend mode uses actual network/database latency
- The `dataMode` setting is per-project (stored in `.clain/mock-data.json`), not global
