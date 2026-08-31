import * as assert from 'assert';
import { IframeContentProvider } from '../../iframeContentProvider';
import { ConnectionInfo } from '../../webviewManager';

suite('IframeContentProvider Tests', () => {
    let provider: IframeContentProvider;

    setup(() => {
        provider = new IframeContentProvider();
    });

    suite('getHtml', () => {
        test('Should generate HTML with disconnected state', () => {
            const info: ConnectionInfo = {
                state: 'disconnected'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('<!DOCTYPE html>'));
            assert.ok(html.includes('No Preview Available'));
            assert.ok(!html.includes('<iframe'));
        });

        test('Should generate HTML with connecting state', () => {
            const info: ConnectionInfo = {
                state: 'connecting'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('Starting Preview'));
            assert.ok(html.includes('Waiting for Kestrel'));
            assert.ok(!html.includes('<iframe'));
        });

        test('Should generate HTML with error state', () => {
            const info: ConnectionInfo = {
                state: 'error',
                errorMessage: 'Connection failed'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('Connection Error'));
            assert.ok(html.includes('Connection failed'));
            assert.ok(!html.includes('<iframe'));
        });

        test('Should generate HTML with connected state and iframe', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('<iframe'));
            assert.ok(html.includes('src="http://localhost:5000"'));
            assert.ok(html.includes('id="preview-frame"'));
        });

        test('Should inject click capture script when connected', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            // Verify script injection logic is present
            assert.ok(html.includes('Inject click capture script'));
            assert.ok(html.includes('window.addEventListener(\'message\''));
            assert.ok(html.includes('clain-click'));
        });

        test('Should handle postMessage for click events', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            // Verify message handling is set up
            assert.ok(html.includes('event.data.type === \'clain-click\''));
            assert.ok(html.includes('vscode.postMessage'));
        });

        test('Should include click capture script with data-clain-src extraction', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            // Verify click capture script content
            assert.ok(html.includes('data-clain-src'));
            assert.ok(html.includes('click'));
            assert.ok(html.includes('window.parent.postMessage'));
        });

        test('Should prevent default action for clicks with data-clain-src', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('preventDefault'));
            assert.ok(html.includes('stopPropagation'));
        });

        test('Should traverse DOM tree to find data-clain-src on ancestors', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            // Verify ancestor traversal logic
            assert.ok(html.includes('parentElement'));
            assert.ok(html.includes('while (element'));
        });

        test('Should include CSS for all connection states', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('<style>'));
            assert.ok(html.includes('iframe'));
            assert.ok(html.includes('.status-bar'));
        });

        test('Should use vscode API to post messages', () => {
            const info: ConnectionInfo = {
                state: 'connected',
                url: 'http://localhost:5000'
            };

            const html = provider.getHtml(info);

            assert.ok(html.includes('acquireVsCodeApi'));
            assert.ok(html.includes('vscode.postMessage'));
        });
    });
});
