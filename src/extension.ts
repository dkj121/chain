import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Clain extension is now active');

    const startPreviewCommand = vscode.commands.registerCommand('clain.startPreview', () => {
        const panel = vscode.window.createWebviewPanel(
            'clainPreview',
            'Clain Preview',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent();

        vscode.window.showInformationMessage('Clain: Preview started');
    });

    context.subscriptions.push(startPreviewCommand);
}

function getWebviewContent(): string {
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
    </style>
</head>
<body>
    <div class="placeholder">
        <h1>Clain Preview</h1>
        <p>Preview will render here</p>
    </div>
</body>
</html>`;
}

export function deactivate() {}
