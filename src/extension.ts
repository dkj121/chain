import * as vscode from 'vscode';
import { KestrelManager } from './kestrelManager';

let kestrelManager: KestrelManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Clain extension is now active');

    const outputChannel = vscode.window.createOutputChannel('Clain - Kestrel');
    kestrelManager = new KestrelManager(outputChannel);

    const startPreviewCommand = vscode.commands.registerCommand('clain.startPreview', async () => {
        try {
            // Find workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open. Please open an ASP.NET Core project.');
                return;
            }

            const projectPath = workspaceFolders[0].uri.fsPath;

            // Check if Kestrel is already running
            if (kestrelManager.isRunning()) {
                vscode.window.showWarningMessage('Kestrel is already running');
                return;
            }

            // Create webview panel first
            const panel = vscode.window.createWebviewPanel(
                'clainPreview',
                'Clain Preview',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = getWebviewContent('connecting');

            // Start Kestrel in background
            vscode.window.showInformationMessage('Starting Kestrel server...');

            await kestrelManager.start(projectPath);

            // Update webview to show ready state
            panel.webview.html = getWebviewContent('ready');
            vscode.window.showInformationMessage('Kestrel server is ready');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start Kestrel: ${errorMessage}`);
        }
    });

    const stopPreviewCommand = vscode.commands.registerCommand('clain.stopPreview', () => {
        kestrelManager.stop();
        vscode.window.showInformationMessage('Clain: Preview stopped');
    });

    context.subscriptions.push(startPreviewCommand, stopPreviewCommand, kestrelManager);
}

function getWebviewContent(state: 'connecting' | 'ready' = 'connecting'): string {
    const message = state === 'connecting'
        ? '<p>Connecting to Kestrel server...</p>'
        : '<p>Preview will render here</p>';

    const statusClass = state === 'connecting' ? 'connecting' : 'ready';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clain Preview</title>
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .placeholder {
            text-align: center;
            padding: 40px;
            border: 2px dashed var(--vscode-panel-border);
            border-radius: 8px;
        }
        .connecting {
            border-color: var(--vscode-progressBar-background);
        }
        .ready {
            border-color: var(--vscode-charts-green);
        }
    </style>
</head>
<body>
    <div class="placeholder ${statusClass}">
        <h1>Clain Preview</h1>
        ${message}
    </div>
</body>
</html>`;
}

export function deactivate() {
    if (kestrelManager) {
        kestrelManager.dispose();
    }
}
