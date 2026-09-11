# clain:data-switch - Data Mode Switcher

## Purpose

Toggle between mock data and real backend data modes during design-time preview. Updates `.clain/mock-data.json` globalSettings to switch data sources without modifying application code.

## When to use

- User runs "Clain: Data Switch" command
- Need to preview UI with mock data vs real backend
- Testing how UI handles different data states
- Switching between design mode and live data validation

## Prerequisites

- `.clain/mock-data.json` exists (run `clain:generate-mock-data` first)
- Kestrel preview server is running (optional, but switch takes effect on next reload)

## Steps

### 1. Read current data mode

Load `.clain/mock-data.json` and check `globalSettings.dataMode`:
- `"mock"` → Currently using mock data
- `"backend"` → Currently using real backend data

### 2. Show mode selection UI

Present VS Code QuickPick with options:
```
> Mock Data (Current)
  Real Backend Data
  
Description:
Mock: Use generated data from mock-data.json
Backend: Connect to real Controllers/APIs
```

Indicate current mode with "(Current)" suffix.

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

Preserve all other fields in mock-data.json unchanged.

### 4. Reload preview (if running)

If Kestrel preview is active:
- Send reload command to webview iframe
- OR show notification: "Data mode changed. Reload preview to apply."

If preview not running:
- Show notification: "Data mode changed to [mode]. Start preview to see changes."

### 5. Optional: Adjust fallback behavior

Ask user if they want to configure fallback behavior:
```
When backend fails, should Clain fall back to mock data?
> Yes (Recommended for development)
  No (Show errors instead)
```

Update `fallbackToMockOnError` based on selection.

### 6. Optional: Configure mock delay

For mock mode, ask if user wants to simulate network latency:
```
Simulate network delay for mock data?
> No delay (instant)
  250ms (fast)
  500ms (typical)
  1000ms (slow network)
  Custom...
```

Update `mockDelay` value in milliseconds.

## Output

Show VS Code information message:
```
✓ Data mode switched to: [Mock Data / Real Backend]
  Fallback enabled: [Yes / No]
  Mock delay: [0ms / 500ms]
  
Preview will reload on next refresh.
```

## Error handling

- **mock-data.json missing**: Show error, suggest running `clain:generate-mock-data` first
- **Invalid JSON structure**: Show error with details, offer to regenerate file
- **Preview reload fails**: Show warning, suggest manual refresh (F5 in webview)

## Advanced options

### Custom configuration panel

For advanced users, show TreeView with all settings:
```
Data Mode Settings
├─ Mode: Mock Data ▼
├─ Fallback: Enabled ☑
├─ Mock Delay: 0ms
└─ Custom Overrides (0)
```

Allow inline editing of all globalSettings fields.

### Per-ViewModel overrides

Future enhancement: Allow mixed mode where some ViewModels use mock, others use backend:
```json
{
  "globalSettings": {
    "dataMode": "mock",
    "overrides": {
      "MyApp.ViewModels.Products.ProductListViewModel": "backend"
    }
  }
}
```

## Notes

- This skill only updates configuration, does not generate or modify data
- Changes take effect on next preview refresh (hot reload if supported)
- Backend mode requires Controllers to return proper ViewModels
- Mock mode reads data from `mock-data.json` models section
- `fallbackToMockOnError` is useful for partial backend implementations
