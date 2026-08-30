import * as vscode from 'vscode';
import { KestrelManager } from './kestrelManager';
import { WebviewManager, MessageHandler } from './webviewManager';
import { IframeContentProvider } from './iframeContentProvider';
import { ClickHandler, ClickEvent } from './clickHandler';

let kestrelManager: KestrelManager;
let webviewManager: WebviewManager;
let clickHandler: ClickHandler;

class WebviewMessageHandler implements MessageHandler {
    constructor(private clickHandler: ClickHandler) {}

    handleMessage(message: any): void {
        if (message.type === 'click' && message.event) {
            const clickEvent: ClickEvent = {
                x: message.event.x || 0,
                y: message.event.y || 0,
                tagName: message.event.tagName || 'unknown',
                id: message.event.id,
                className: message.event.className,
                textContent: message.event.textContent,
                timestamp: message.event.timestamp || Date.now(),
                dataClainSrc: message.event.dataClainSrc
            };
            this.clickHandler.handleClick(clickEvent);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Clain extension is now active');

    const outputChannel = vscode.window.createOutputChannel('Clain - Kestrel');
    const clickOutputChannel = vscode.window.createOutputChannel('Clain - Clicks');
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

            // Initialize click handler with workspace root
            clickHandler = new ClickHandler(
                clickOutputChannel,
                projectPath,
                vscode.window,
                vscode.Uri,
                vscode.Range,
                vscode.Position
            );

            // Create webview manager with message handler
            const messageHandler = new WebviewMessageHandler(clickHandler);
            webviewManager = new WebviewManager(new IframeContentProvider(), messageHandler);

            // Create webview panel with connecting state
            webviewManager.createPanel(vscode.window, 'http://localhost:5000');

            // Start Kestrel in background
            vscode.window.showInformationMessage('Starting Kestrel server...');

            try {
                await kestrelManager.start(projectPath);

                // Get the actual server URL from Kestrel output
                const serverUrl = kestrelManager.getServerUrl() || 'http://localhost:5000';

                // Update webview to show connected state with iframe
                webviewManager.onServerReady(serverUrl);
                vscode.window.showInformationMessage('Kestrel server is ready');

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                webviewManager.onConnectionError(errorMessage);
                throw error;
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start Kestrel: ${errorMessage}`);
        }
    });

    const stopPreviewCommand = vscode.commands.registerCommand('clain.stopPreview', () => {
        kestrelManager.stop();
        webviewManager.dispose();
        vscode.window.showInformationMessage('Clain: Preview stopped');
    });

    const refreshPreviewCommand = vscode.commands.registerCommand('clain.refreshPreview', () => {
        webviewManager.refresh();
        vscode.window.showInformationMessage('Preview refreshed');
    });

    context.subscriptions.push(
        startPreviewCommand,
        stopPreviewCommand,
        refreshPreviewCommand,
        kestrelManager,
        webviewManager
    );
}

export function deactivate() {
    if (kestrelManager) {
        kestrelManager.dispose();
    }
    if (webviewManager) {
        webviewManager.dispose();
    }
}
