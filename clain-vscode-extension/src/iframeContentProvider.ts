import { WebviewContent, ConnectionInfo, ConnectionState } from './webviewManager';

const DEFAULT_CONNECTION_ERROR = 'Failed to connect to server';

export class IframeContentProvider implements WebviewContent {
    getHtml(info: ConnectionInfo): string {
        const statusMessage = this.getStatusMessage(info.state, info.errorMessage);
        const statusClass = this.getStatusClass(info.state);
        const iframeHtml = info.state === 'connected' && info.url
            ? `<iframe id="preview-frame" src="${info.url}" title="Preview"></iframe>`
            : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clain Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .status-bar {
            padding: 8px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: var(--vscode-statusBar-background);
        }

        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .status-indicator.connecting {
            background-color: var(--vscode-progressBar-background);
            animation: pulse 1.5s ease-in-out infinite;
        }

        .status-indicator.connected {
            background-color: var(--vscode-charts-green);
        }

        .status-indicator.error {
            background-color: var(--vscode-errorForeground);
        }

        .status-indicator.disconnected {
            background-color: var(--vscode-descriptionForeground);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .status-text {
            font-size: 12px;
        }

        .preview-container {
            flex: 1;
            position: relative;
            overflow: hidden;
        }

        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background-color: white;
        }

        .placeholder {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 40px;
        }

        .placeholder h2 {
            margin-bottom: 16px;
            color: var(--vscode-foreground);
        }

        .placeholder p {
            color: var(--vscode-descriptionForeground);
        }

        .error-message {
            color: var(--vscode-errorForeground);
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="status-bar">
        <div class="status-indicator ${statusClass}"></div>
        <span class="status-text">${statusMessage}</span>
    </div>

    <div class="preview-container">
        ${iframeHtml}
        ${info.state !== 'connected' ? this.getPlaceholderHtml(info.state, info.errorMessage) : ''}
    </div>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            const iframe = document.getElementById('preview-frame');

            if (iframe) {
                iframe.addEventListener('error', function(e) {
                    console.error('Iframe load error:', e);
                });

                iframe.addEventListener('load', function() {
                    console.log('Iframe loaded successfully');

                    // Inject click capture script into iframe content
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        const script = iframeDoc.createElement('script');
                        script.textContent = ${this.getClickCaptureScript()};
                        iframeDoc.body.appendChild(script);
                    } catch (e) {
                        console.error('Failed to inject click capture script:', e);
                    }
                });
            }

            // Listen for messages from iframe
            window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'clain-click') {
                    // Forward click event to extension host
                    vscode.postMessage({
                        type: 'click',
                        event: event.data.event
                    });
                }
            });
        })();
    </script>
</body>
</html>`;
    }

    private getStatusMessage(state: ConnectionState, errorMessage?: string): string {
        switch (state) {
            case 'connecting':
                return 'Connecting to Kestrel server...';
            case 'connected':
                return 'Connected';
            case 'error':
                return errorMessage || 'Connection error';
            case 'disconnected':
                return 'Disconnected';
        }
    }

    private getStatusClass(state: ConnectionState): string {
        return state;
    }

    private getClickCaptureScript(): string {
        // This script will be injected into the iframe to capture clicks
        // It needs to be serialized as a string
        return `\`
            (function() {
                console.log('Clain click capture script loaded');

                document.addEventListener('click', function(e) {
                    // Find the clicked element or closest ancestor with data-clain-src
                    let element = e.target;
                    let dataClainSrc = null;

                    while (element && element !== document.body) {
                        if (element.hasAttribute && element.hasAttribute('data-clain-src')) {
                            dataClainSrc = element.getAttribute('data-clain-src');
                            break;
                        }
                        element = element.parentElement;
                    }

                    if (dataClainSrc) {
                        console.log('Clicked element with data-clain-src:', dataClainSrc);

                        // Send message to parent window (webview)
                        window.parent.postMessage({
                            type: 'clain-click',
                            event: {
                                x: e.clientX,
                                y: e.clientY,
                                tagName: e.target.tagName,
                                id: e.target.id || undefined,
                                className: e.target.className || undefined,
                                textContent: e.target.textContent?.substring(0, 100) || undefined,
                                timestamp: Date.now(),
                                dataClainSrc: dataClainSrc
                            }
                        }, '*');

                        // Prevent default action for clicks with data-clain-src
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }, true); // Use capture phase to catch clicks before any other handlers
            })();
        \``;
    }

    private getPlaceholderHtml(state: ConnectionState, errorMessage?: string): string {
        if (state === 'connecting') {
            return `
                <div class="placeholder">
                    <h2>Starting Preview</h2>
                    <p>Waiting for Kestrel server to start...</p>
                </div>
            `;
        }

        if (state === 'error') {
            return `
                <div class="placeholder">
                    <h2>Connection Error</h2>
                    <p class="error-message">${errorMessage || DEFAULT_CONNECTION_ERROR}</p>
                </div>
            `;
        }

        return `
            <div class="placeholder">
                <h2>No Preview Available</h2>
                <p>Start the preview to see your application</p>
            </div>
        `;
    }
}
