import * as vscode from 'vscode';
import { KestrelManager } from './kestrelManager';
import { WebviewManager, MessageHandler } from './webviewManager';
import { IframeContentProvider } from './iframeContentProvider';
import { ClickHandler, ClickEvent } from './clickHandler';
import { ProjectDiscovery } from './projectDiscovery';
import { PropertiesPanel } from './propertiesPanel';
import { HotReloadWatcher } from './hotReloadWatcher';
import { RazorAstParser } from './razorAstParser';
import { BreadcrumbProvider } from './breadcrumbProvider';
import * as path from 'path';

let kestrelManager: KestrelManager;
let webviewManager: WebviewManager;
let clickHandler: ClickHandler;
let hotReloadWatcher: HotReloadWatcher | undefined;
let razorParser: RazorAstParser;
let breadcrumbProvider: BreadcrumbProvider;

class WebviewMessageHandler implements MessageHandler {
    constructor(
        private clickHandler: ClickHandler,
        private breadcrumbProvider?: BreadcrumbProvider
    ) {}

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
        } else if (message.type === 'breadcrumbClick' && this.breadcrumbProvider) {
            // Handle breadcrumb level click
            this.breadcrumbProvider.selectBreadcrumbLevel(message.index);
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

            const workspaceRoot = workspaceFolders[0].uri.fsPath;

            // Check if Kestrel is already running
            if (kestrelManager.isRunning()) {
                vscode.window.showWarningMessage('Kestrel is already running');
                return;
            }

            // Discover .csproj files
            const discovery = new ProjectDiscovery(
                workspaceRoot,
                async (pattern, exclude) => {
                    const uris = await vscode.workspace.findFiles(pattern, exclude);
                    return uris.map(uri => uri.fsPath);
                }
            );
            const projects = await discovery.findProjects();

            if (projects.length === 0) {
                vscode.window.showErrorMessage('No .csproj files found in the workspace. Please open an ASP.NET Core project.');
                return;
            }

            // Show QuickPick to select project
            const items = projects.map(project => ({
                label: project.name,
                description: path.relative(workspaceRoot, project.path),
                project: project
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a project to preview',
                matchOnDescription: true
            });

            if (!selected) {
                // User cancelled
                return;
            }

            const selectedProject = selected.project;
            const csprojPath = selectedProject.path;
            const projectDirectory = selectedProject.directory;

            // Initialize click handler with project directory (Q4: A)
            clickHandler = new ClickHandler(
                clickOutputChannel,
                projectDirectory,
                vscode.window,
                vscode.Uri,
                vscode.Range,
                vscode.Position
            );

            // Initialize Razor AST parser and breadcrumb provider
            razorParser = new RazorAstParser();
            breadcrumbProvider = new BreadcrumbProvider(razorParser);

            // Wire up breadcrumb updates to webview
            breadcrumbProvider.onBreadcrumbUpdate((breadcrumb) => {
                if (webviewManager) {
                    webviewManager.postMessage({
                        type: 'updateBreadcrumb',
                        breadcrumb: breadcrumb.map((node, index) => ({
                            label: breadcrumbProvider.formatNode(node),
                            kind: node.kind,
                            index: index
                        }))
                    });
                }
            });

            // Create webview manager with message handler
            const messageHandler = new WebviewMessageHandler(clickHandler, breadcrumbProvider);
            webviewManager = new WebviewManager(new IframeContentProvider(), messageHandler);

            // Set up hot reload watcher for .cshtml files
            hotReloadWatcher = new HotReloadWatcher(webviewManager);

            // Create webview panel with connecting state
            webviewManager.createPanel(vscode.window, 'http://localhost:5000');

            // Start Kestrel in background
            vscode.window.showInformationMessage(`Starting Kestrel server for ${selectedProject.name}...`);

            try {
                await kestrelManager.start(workspaceRoot, csprojPath);

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
        if (hotReloadWatcher) {
            hotReloadWatcher.dispose();
            hotReloadWatcher = undefined;
        }
        vscode.window.showInformationMessage('Clain: Preview stopped');
    });

    const refreshPreviewCommand = vscode.commands.registerCommand('clain.refreshPreview', () => {
        webviewManager.refresh();
        vscode.window.showInformationMessage('Preview refreshed');
    });

    // Register Properties Panel
    const propertiesPanel = new PropertiesPanel();
    const propertiesPanelProvider = vscode.window.registerWebviewViewProvider(
        PropertiesPanel.viewType,
        propertiesPanel
    );

    const showPropertiesCommand = vscode.commands.registerCommand('clain.showProperties', () => {
        vscode.commands.executeCommand('clain.propertiesPanel.focus');
    });

    context.subscriptions.push(
        startPreviewCommand,
        stopPreviewCommand,
        refreshPreviewCommand,
        propertiesPanelProvider,
        showPropertiesCommand,
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
    if (hotReloadWatcher) {
        hotReloadWatcher.dispose();
    }
    if (razorParser) {
        razorParser.dispose();
    }
    if (breadcrumbProvider) {
        breadcrumbProvider.dispose();
    }
}
