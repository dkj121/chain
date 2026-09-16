export interface IWebviewRefreshable {
    refresh(): void;
    showLoadingIndicator?(): void;
    hideLoadingIndicator?(): void;
}

export interface IDisposable {
    dispose(): void;
}

export interface IUri {
    fsPath: string;
}

export interface IFileSystemWatcher {
    onDidChange(listener: (uri: IUri) => void): IDisposable;
    onDidCreate(listener: (uri: IUri) => void): IDisposable;
    onDidDelete(listener: (uri: IUri) => void): IDisposable;
    dispose(): void;
}

/**
 * Watches .cshtml files for changes and triggers hot reload with debouncing.
 */
export class HotReloadWatcher implements IDisposable {
    private fileWatcher: IFileSystemWatcher | undefined;
    private debounceTimer: NodeJS.Timeout | undefined;
    private disposed = false;
    private readonly debounceMs = 300;
    private watchers: IDisposable[] = [];

    constructor(
        private webviewManager: IWebviewRefreshable,
        watcherFactory?: () => IFileSystemWatcher
    ) {
        this.setupFileWatcher(watcherFactory);
    }

    private setupFileWatcher(watcherFactory?: () => IFileSystemWatcher): void {
        // Use factory if provided (for testing), otherwise create real watcher
        if (watcherFactory) {
            this.fileWatcher = watcherFactory();
        } else {
            // Lazy load vscode only when actually needed (not in tests)
            const vscode = require('vscode');
            this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.cshtml');
        }

        if (!this.fileWatcher) {
            return;
        }

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

    private handleFileChange(uri: IUri): void {
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
