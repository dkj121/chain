export type ConnectionState = 'connecting' | 'connected' | 'error' | 'disconnected';

export interface ConnectionInfo {
    state: ConnectionState;
    url?: string;
    errorMessage?: string;
}

export interface WebviewContent {
    getHtml(info: ConnectionInfo): string;
}

export interface MessageHandler {
    handleMessage(message: any): void;
}

export class WebviewManager {
    private panel: any | null = null; // vscode.WebviewPanel in production
    private connectionState: ConnectionState = 'disconnected';
    private serverUrl: string = '';
    private errorMessage: string = '';
    private contentProvider: WebviewContent;
    private messageHandler: MessageHandler | null = null;
    private messageDisposable: any = null;

    constructor(contentProvider: WebviewContent, messageHandler?: MessageHandler) {
        this.contentProvider = contentProvider;
        this.messageHandler = messageHandler || null;
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

        // Set up message handler if provided
        if (this.messageHandler && this.panel.webview.onDidReceiveMessage) {
            this.messageDisposable = this.panel.webview.onDidReceiveMessage(
                (message: any) => this.messageHandler?.handleMessage(message)
            );
        }

        this.updateContent();
    }

    public onServerReady(url: string): void {
        this.serverUrl = url;
        this.connectionState = 'connected';
        this.updateContent();
    }

    public onConnectionError(errorMessage: string): void {
        this.connectionState = 'error';
        this.errorMessage = errorMessage;
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
        if (this.messageDisposable) {
            this.messageDisposable.dispose();
            this.messageDisposable = null;
        }
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

        this.panel.webview.html = this.contentProvider.getHtml({
            state: this.connectionState,
            url: this.serverUrl,
            errorMessage: this.errorMessage
        });
    }
}
