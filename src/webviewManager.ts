export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

export interface WebviewContent {
    getHtml(state: ConnectionState, url?: string, errorMessage?: string): string;
}

export class WebviewManager {
    private panel: any | null = null; // vscode.WebviewPanel in production
    private connectionState: ConnectionState = 'disconnected';
    private serverUrl: string = '';
    private contentProvider: WebviewContent;

    constructor(contentProvider: WebviewContent) {
        this.contentProvider = contentProvider;
    }

    public createPanel(vscodeWindow: any, url: string): void {
        this.serverUrl = url;
        this.connectionState = 'connecting';

        this.panel = vscodeWindow.createWebviewPanel(
            'clainPreview',
            'Clain Preview',
            1, // ViewColumn.One
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.updateContent();
    }

    public onServerReady(url: string): void {
        this.serverUrl = url;
        this.connectionState = 'connected';
        this.updateContent();
    }

    public onConnectionError(errorMessage: string): void {
        this.connectionState = 'error';
        this.updateContent();
    }

    public refresh(): void {
        if (this.connectionState === 'connected') {
            this.updateContent();
        }
    }

    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
        this.connectionState = 'disconnected';
    }

    private updateContent(): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.html = this.contentProvider.getHtml(
            this.connectionState,
            this.serverUrl
        );
    }
}
