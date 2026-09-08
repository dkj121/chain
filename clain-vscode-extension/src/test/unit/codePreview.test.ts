import * as assert from 'assert';
import { PropertiesPanel } from '../../propertiesPanel';

suite('Code Preview Panel Tests', () => {
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
                cspSource: 'test-csp',
                postMessage: () => {}
            },
            onDidDispose: () => ({ dispose: () => {} }),
            visible: true
        };
    });

    test('Should include Monaco editor container in HTML', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        assert.ok(mockWebviewView.webview.html.includes('monacoEditor'));
        assert.ok(mockWebviewView.webview.html.includes('Code Preview'));
    });

    test('Should load Monaco editor from CDN', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        assert.ok(mockWebviewView.webview.html.includes('monaco-editor'));
        assert.ok(mockWebviewView.webview.html.includes('cdn.jsdelivr.net'));
    });

    test('Should include CSP for Monaco editor resources', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        const html = mockWebviewView.webview.html;
        assert.ok(html.includes('Content-Security-Policy'));
        assert.ok(html.includes('https://cdn.jsdelivr.net'));
        assert.ok(html.includes('worker-src blob:'));
    });

    test('Should include code change handler', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        const html = mockWebviewView.webview.html;
        assert.ok(html.includes('handleCodeChange'));
        assert.ok(html.includes('codeChanged'));
    });

    test('Should include Monaco configuration', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        const html = mockWebviewView.webview.html;
        assert.ok(html.includes('monaco.editor.create'));
        assert.ok(html.includes('language: \'razor\''));
        assert.ok(html.includes('minimap: { enabled: false }'));
    });

    test('Should include code context update logic', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        const html = mockWebviewView.webview.html;
        assert.ok(html.includes('updateMonacoEditor'));
        assert.ok(html.includes('codeContext'));
    });

    test('Should handle code preview section styling', () => {
        panel.resolveWebviewView(mockWebviewView, {} as any, {} as any);

        const html = mockWebviewView.webview.html;
        assert.ok(html.includes('.code-preview-section'));
        assert.ok(html.includes('#monacoEditor'));
    });
});
