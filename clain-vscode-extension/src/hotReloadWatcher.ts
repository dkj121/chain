import * as vscode from 'vscode';

export interface IWebviewRefreshable {
    refresh(): void;
    showLoadingIndicator?(): void;
    hideLoadingIndicator?(): void;
}

export interface IFileSystemWatcher {
    onDidChange(listener: (uri: vscode.Uri) => void): vscode.Disposable;
    onDidCreate(listener: (uri: vscode.Uri) => void): vscode.Disposable;
    onDidDelete(listener: (uri: vscode.Uri) => void): vscode.Disposable;
    dispose(): void;
}

/**
 * Watches .cshtml files for changes and triggers hot reload with debouncing.
 */
export class HotReloadWatcher implements vscode.Disposable {
    private fileWatcher: IFileSystemWatcher | undefined;
    private debounceTimer: NodeJS.Timeout | undefined;
    private disposed = false;
    private readonly debounceMs = 300;
    private watchers: vscode.Disposable[] = [];

    constructor(
        private webviewManager: IWebviewRefreshable,
        watcherFactory?: () => IFileSystemWatcher
    ) {
        this.setupFileWatcher(watcherFactory);
    }

    private setupFileWatcher(watcherFactory?: () => IFileSystemWatcher): void {
        // Use factory if provided (for testing), otherwise create real watcher
        this.fileWatcher = watcherFactory
            ? watcherFactory()
            : vscode.workspace.createFileSystemWatcher('**/*.cshtml');

        this.watchers.push(
            this.fileWatcher.onDidChange((uri) => this.handleFileChange(uri))
        );
        this.watchers.push(
            this.fileWatcher.onDidCreate((uri) => this.handleFileChange(uri))
        );
        this.watchers.push(
            this.fileWatcher.onDidDelete((uri) => this.handleFileChange(uri))
        );
    }

    private handleFileChange(uri: vscode.Uri): void {
        if (this.disposed) {
            return;
        }

        // Show loading indicator immediately
        if (this.webviewManager.showLoadingIndicator) {
            this.webviewManager.showLoadingIndicator();
        }

        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer for debounced refresh
        this.debounceTimer = setTimeout(() => {
            if (!this.disposed) {
                this.webviewManager.refresh();
                if (this.webviewManager.hideLoadingIndicator) {
                    this.webviewManager.hideLoadingIndicator();
                }
            }
        }, this.debounceMs);
    }

    public dispose(): void {
        this.disposed = true;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }

        this.watchers.forEach(w => w.dispose());
        this.watchers = [];

        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = undefined;
        }
    }
}
