import * as vscode from 'vscode';
import { SelectionStateManager, ElementSelection } from './selectionStateManager';

/**
 * Provides the Properties Panel webview that displays element properties.
 * Initially shows a placeholder message until an element is selected.
 */
export class PropertiesPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clain.propertiesPanel';
    private webviewView?: vscode.WebviewView;
    private selectionManager = SelectionStateManager.getInstance();

    constructor() {}

    /**
     * Called when the webview view is first created or restored.
     * Sets up the webview content and options.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webviewView = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };

        webviewView.webview.html = this.getHtmlContent(webviewView.webview);

        // Listen for selection changes
        this.selectionManager.onSelectionChange((selection) => {
            this.updateProperties(selection);
        });

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage((message) => {
            this.handleMessage(message);
        });
    }

    /**
     * Update the properties panel with element data.
     */
    private updateProperties(selection: ElementSelection | null): void {
        if (!this.webviewView) {
            return;
        }

        this.webviewView.webview.postMessage({
            type: 'updateProperties',
            selection: selection
        });
    }

    /**
     * Handle messages from the webview.
     */
    private handleMessage(message: any): void {
        switch (message.type) {
            case 'attributeChanged':
                // TODO: Apply attribute changes back to the file
                console.log('Attribute changed:', message.attribute, message.value);
                break;
        }
    }

    /**
     * Generates the HTML content for the properties panel.
     */
    private getHtmlContent(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';">
    <title>Properties Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .placeholder {
            text-align: center;
            color: var(--vscode-descriptionForeground);
        }

        .placeholder h2 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        .placeholder p {
            font-size: 13px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="placeholder">
        <h2>Properties Panel</h2>
        <p>Select an element in the preview to view its properties</p>
    </div>
</body>
</html>`;
    }
}
