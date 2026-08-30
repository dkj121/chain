import * as vscode from 'vscode';
import { KestrelManager } from './kestrelManager';
import { WebviewManager } from './webviewManager';
import { IframeContentProvider } from './iframeContentProvider';
import { NuGetManager } from './nugetManager';

let kestrelManager: KestrelManager;
let webviewManager: WebviewManager;
let nugetManager: NuGetManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Clain extension is now active');

    const outputChannel = vscode.window.createOutputChannel('Clain - Kestrel');
    kestrelManager = new KestrelManager(outputChannel);
    webviewManager = new WebviewManager(new IframeContentProvider());
    nugetManager = new NuGetManager();

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

    const installHtmxTagHelpersCommand = vscode.commands.registerCommand('clain.installHtmxTagHelpers', async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            // Find the folder containing a .csproj file
            let projectPath: string | undefined;
            for (const folder of workspaceFolders) {
                const files = await vscode.workspace.fs.readDirectory(folder.uri);
                const hasCsproj = files.some(([name]) => name.endsWith('.csproj'));
                if (hasCsproj) {
                    projectPath = folder.uri.fsPath;
                    break;
                }
            }

            if (!projectPath) {
                vscode.window.showErrorMessage('No .csproj file found in workspace folders');
                return;
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Installing HtmxTagHelpers package',
                    cancellable: false
                },
                async (progress) => {
                    progress.report({ message: 'Adding package...' });
                    await nugetManager.addPackage(projectPath!, 'HtmxTagHelpers');

                    progress.report({ message: 'Restoring packages...' });
                    await nugetManager.restore(projectPath!);
                }
            );

            vscode.window.showInformationMessage('HtmxTagHelpers package installed successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to install HtmxTagHelpers: ${errorMessage}`);
        }
    });

    context.subscriptions.push(
        startPreviewCommand,
        stopPreviewCommand,
        refreshPreviewCommand,
        installHtmxTagHelpersCommand,
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
