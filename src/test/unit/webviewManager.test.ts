import * as assert from 'assert';
import { WebviewManager, ConnectionState, WebviewContent, ConnectionInfo } from '../../webviewManager';

class MockWebviewContent implements WebviewContent {
    public lastInfo: ConnectionInfo | null = null;

    getHtml(info: ConnectionInfo): string {
        this.lastInfo = { ...info }; // Make a copy to avoid reference issues
        return `<html><body>State: ${info.state}, URL: ${info.url}</body></html>`;
    }
}

class MockWebviewPanel {
    public webview = {
        html: ''
    };
    public disposed = false;

    dispose(): void {
        this.disposed = true;
    }
}

class MockVscodeWindow {
    public lastPanel: MockWebviewPanel | null = null;

    createWebviewPanel(viewType: string, title: string, column: number, options: any): MockWebviewPanel {
        this.lastPanel = new MockWebviewPanel();
        return this.lastPanel;
    }
}

suite('WebviewManager Tests', () => {
    let webviewManager: WebviewManager;
    let mockContent: MockWebviewContent;
    let mockWindow: MockVscodeWindow;

    setup(() => {
        mockContent = new MockWebviewContent();
        mockWindow = new MockVscodeWindow();
        webviewManager = new WebviewManager(mockContent);
    });

    teardown(() => {
        webviewManager.dispose();
    });

    test('Should initialize with disconnected state', () => {
        assert.strictEqual(webviewManager.getConnectionState(), 'disconnected');
    });

    test('Should create panel with connecting state', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');

        assert.strictEqual(webviewManager.getConnectionState(), 'connecting');
        assert.strictEqual(mockContent.lastInfo?.state, 'connecting');
        assert.strictEqual(mockContent.lastInfo?.url, 'http://localhost:5000');
    });

    test('Should transition to connected state when server ready', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');
        webviewManager.onServerReady('http://localhost:5000');

        assert.strictEqual(webviewManager.getConnectionState(), 'connected');
        assert.strictEqual(mockContent.lastInfo?.state, 'connected');
    });

    test('Should transition to error state on connection failure', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');
        webviewManager.onConnectionError('Connection refused');

        assert.strictEqual(webviewManager.getConnectionState(), 'error');
        assert.strictEqual(mockContent.lastInfo?.state, 'error');
        assert.strictEqual(mockContent.lastInfo?.errorMessage, 'Connection refused');
    });

    test('Should update webview HTML when state changes', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');
        const panel = mockWindow.lastPanel!;

        assert.ok(panel.webview.html.includes('connecting'));

        webviewManager.onServerReady('http://localhost:5000');

        assert.ok(panel.webview.html.includes('connected'));
    });

    test('Should refresh content when connected', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');
        webviewManager.onServerReady('http://localhost:5000');

        const initialState = mockContent.lastInfo?.state;

        webviewManager.refresh();

        // Verify getHtml was called again - lastInfo should still be connected
        assert.strictEqual(mockContent.lastInfo?.state, 'connected');
        assert.strictEqual(initialState, 'connected');
    });

    test('Should not refresh when not connected', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');

        mockContent.lastInfo = null; // Reset to null after createPanel

        webviewManager.refresh();

        // Should not call getHtml again since we're still connecting
        assert.strictEqual(mockContent.lastInfo, null);
    });

    test('Should dispose panel and reset state', () => {
        webviewManager.createPanel(mockWindow, 'http://localhost:5000');
        const panel = mockWindow.lastPanel!;

        webviewManager.dispose();

        assert.strictEqual(panel.disposed, true);
        assert.strictEqual(webviewManager.getConnectionState(), 'disconnected');
    });
});
