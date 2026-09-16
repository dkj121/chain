import * as assert from 'assert';
import { PropertiesPanel } from '../../propertiesPanel';

suite('PropertiesPanel Tests', () => {
    let panel: PropertiesPanel;
    let mockWebviewView: any;

    setup(() => {
        panel = new PropertiesPanel();
        mockWebviewView = {
            webview: {
                options: {},
                html: '',
                onDidReceiveMessage: () => ({ dispose: () => {} }),
                asWebviewUri: (uri: any) => uri,
                cspSource: 'test-csp'
            },
            onDidDispose: () => ({ dispose: () => {} }),
            visible: true
        };
    });

    test('Should initialize with placeholder content', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        assert.ok(mockWebviewView.webview.html);
        assert.ok(mockWebviewView.webview.html.includes('Properties Panel'));
        assert.ok(mockWebviewView.webview.html.toLowerCase().includes('select an element'));
    });

    test('Should set webview options correctly', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        assert.strictEqual(mockWebviewView.webview.options.enableScripts, true);
    });

    test('Should maintain state across multiple resolve calls', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        const firstHtml = mockWebviewView.webview.html;

        const secondMockView = { ...mockWebviewView, webview: { ...mockWebviewView.webview } };
        panel.resolveWebviewView(secondMockView, {} as any, {} as any);

        assert.strictEqual(secondMockView.webview.html, firstHtml);
    });

    test('Should include proper HTML structure', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        const html = mockWebviewView.webview.html;

        assert.ok(html.includes('<!DOCTYPE html>'));
        assert.ok(html.includes('<html'));
        assert.ok(html.includes('<head>'));
        assert.ok(html.includes('<body>'));
        assert.ok(html.includes('<style>'));
    });

    test('Should use VS Code theme variables', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        const html = mockWebviewView.webview.html;

        assert.ok(html.includes('var(--vscode-'));
    });

    test('Should set CSP meta tag', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        const html = mockWebviewView.webview.html;

        assert.ok(html.includes('Content-Security-Policy'));
    });

    test('Should have responsive layout', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        const html = mockWebviewView.webview.html;

        assert.ok(html.includes('box-sizing'));
        assert.ok(html.includes('padding'));
    });

    test('Should display centered placeholder message', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        const html = mockWebviewView.webview.html;

        assert.ok(html.includes('text-align'));
    });
});
