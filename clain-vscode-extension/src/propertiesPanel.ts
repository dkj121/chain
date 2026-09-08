import * as vscode from 'vscode';
import { SelectionStateManager, ElementSelection } from './selectionStateManager';

/**
 * Provides the Properties Panel webview that displays element properties.
 * Initially shows a placeholder message until an element is selected.
 */
export class PropertiesPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clain.propertiesPanel';
    private webviewView?: vscode.WebviewView;
    private selectionManager = SelectionStateManager.getInstance();

    constructor() {}

    /**
     * Called when the webview view is first created or restored.
     * Sets up the webview content and options.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.webviewView = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };

        webviewView.webview.html = this.getHtmlContent(webviewView.webview);

        // Listen for selection changes
        this.selectionManager.onSelectionChange((selection) => {
            this.updateProperties(selection);
        });

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage((message) => {
            this.handleMessage(message);
        });
    }

    /**
     * Update the properties panel with element data.
     */
    private async updateProperties(selection: ElementSelection | null): Promise<void> {
        if (!this.webviewView) {
            return;
        }

        let codeContext = null;
        if (selection) {
            codeContext = await this.extractCodeContext(selection);
        }

        this.webviewView.webview.postMessage({
            type: 'updateProperties',
            selection: selection,
            codeContext: codeContext
        });
    }

    /**
     * Extract 5-10 lines of code context around the selected element.
     */
    private async extractCodeContext(selection: ElementSelection): Promise<{ code: string; startLine: number; endLine: number } | null> {
        try {
            const document = await vscode.workspace.openTextDocument(selection.filePath);
            const totalLines = document.lineCount;

            // Extract 5 lines before and 5 lines after (10 lines total, centered on selection)
            const contextLines = 5;
            const startLine = Math.max(0, selection.line - contextLines);
            const endLine = Math.min(totalLines - 1, selection.line + contextLines);

            const lines: string[] = [];
            for (let i = startLine; i <= endLine; i++) {
                lines.push(document.lineAt(i).text);
            }

            return {
                code: lines.join('\n'),
                startLine: startLine,
                endLine: endLine
            };
        } catch (error) {
            console.error('Failed to extract code context:', error);
            return null;
        }
    }

    /**
     * Handle messages from the webview.
     */
    private async handleMessage(message: any): Promise<void> {
        switch (message.type) {
            case 'attributeChanged':
                await this.applyAttributeChange(message);
                break;
            case 'codeChanged':
                await this.applyCodeChange(message);
                break;
        }
    }

    /**
     * Apply code changes from Monaco editor to the source file.
     */
    private async applyCodeChange(message: any): Promise<void> {
        const { code, startLine, endLine, selection } = message;

        if (!selection || !selection.filePath) {
            return;
        }

        try {
            const document = await vscode.workspace.openTextDocument(selection.filePath);
            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
            edit.replace(document.uri, range, code);
            await vscode.workspace.applyEdit(edit);
        } catch (error) {
            console.error('Failed to apply code change:', error);
            vscode.window.showErrorMessage('Failed to apply code changes');
        }
    }

    /**
     * Apply attribute changes to the source file.
     */
    private async applyAttributeChange(message: any): Promise<void> {
        const { attribute, value, selection } = message;

        if (!selection || !selection.filePath) {
            return;
        }

        // Validate input values
        if (attribute === 'id' && value && !/^[a-zA-Z][\w-]*$/.test(value)) {
            vscode.window.showErrorMessage('Invalid ID format. IDs must start with a letter and contain only letters, numbers, hyphens, and underscores.');
            return;
        }

        if (attribute === 'class' && value && !/^[\w\s-]*$/.test(value)) {
            vscode.window.showErrorMessage('Invalid class format. Classes can only contain letters, numbers, hyphens, underscores, and spaces.');
            return;
        }

        if (attribute === 'tagName' && value && !/^[a-zA-Z][\w-]*$/.test(value)) {
            vscode.window.showErrorMessage('Invalid tag name format. Tag names must be valid HTML element names.');
            return;
        }

        try {
            const document = await vscode.workspace.openTextDocument(selection.filePath);
            const line = selection.line;
            const lineText = document.lineAt(line).text;

            // Build the new line with updated attribute
            let newLineText = lineText;

            if (attribute === 'tagName') {
                // Replace tag name (opening tag)
                newLineText = this.replaceTagName(lineText, selection.tagName || 'div', value);
            } else if (attribute === 'class') {
                newLineText = this.replaceAttribute(lineText, 'class', value);
            } else if (attribute === 'id') {
                newLineText = this.replaceAttribute(lineText, 'id', value);
            }

            if (newLineText !== lineText) {
                const edit = new vscode.WorkspaceEdit();
                const range = new vscode.Range(line, 0, line, lineText.length);
                edit.replace(document.uri, range, newLineText);
                await vscode.workspace.applyEdit(edit);
            }
        } catch (error) {
            console.error('Failed to apply attribute change:', error);
        }
    }

    /**
     * Replace tag name in a line of HTML.
     */
    private replaceTagName(lineText: string, oldTag: string, newTag: string): string {
        // Match opening tag: <oldTag...>
        const regex = new RegExp(`<${oldTag}(\\s|>)`, 'i');
        return lineText.replace(regex, `<${newTag}$1`);
    }

    /**
     * Replace or add an attribute in a line of HTML.
     */
    private replaceAttribute(lineText: string, attributeName: string, newValue: string): string {
        const tagMatch = lineText.match(/<(\w+)([^>]*)>/);
        if (!tagMatch) {
            return lineText;
        }

        const tagName = tagMatch[1];
        const attributesSection = tagMatch[2];

        // Escape special regex characters to prevent injection
        const escapedAttrName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Check if attribute exists
        const attrRegex = new RegExp(`${escapedAttrName}="([^"]*)"`, 'i');
        const attrMatch = attributesSection.match(attrRegex);

        let newAttributesSection = attributesSection;

        if (newValue.trim() === '') {
            // Remove attribute if value is empty
            if (attrMatch) {
                newAttributesSection = attributesSection.replace(attrRegex, '').replace(/\s+/g, ' ').trim();
            }
        } else {
            // Add or update attribute
            if (attrMatch) {
                // Replace existing
                newAttributesSection = attributesSection.replace(attrRegex, `${attributeName}="${newValue}"`);
            } else {
                // Add new attribute
                newAttributesSection = attributesSection + ` ${attributeName}="${newValue}"`;
            }
        }

        return lineText.replace(tagMatch[0], `<${tagName}${newAttributesSection}>`);
    }

    /**
     * Generates the HTML content for the properties panel.
     */
    private getHtmlContent(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://cdn.jsdelivr.net; script-src 'unsafe-inline' https://cdn.jsdelivr.net; worker-src blob:; font-src ${webview.cspSource} https://cdn.jsdelivr.net;">
    <title>Properties Panel</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
        }

        .placeholder {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 32px 16px;
        }

        .placeholder h2 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        .placeholder p {
            font-size: 13px;
            line-height: 1.5;
        }

        .properties-form {
            display: none;
        }

        .properties-form.active {
            display: block;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--vscode-foreground);
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 6px 8px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-input-foreground);
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .form-group small {
            display: block;
            margin-top: 4px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }

        .element-info {
            padding: 12px;
            margin-bottom: 16px;
            background-color: var(--vscode-editorWidget-background);
            border-radius: 4px;
            font-size: 12px;
        }

        .element-info strong {
            color: var(--vscode-foreground);
        }

        .element-info span {
            color: var(--vscode-descriptionForeground);
        }

        .code-preview-section {
            margin-top: 24px;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 16px;
        }

        .code-preview-section h3 {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }

        #monacoEditor {
            height: 200px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div id="placeholder" class="placeholder">
        <h2>Properties Panel</h2>
        <p>Select an element in the preview to view its properties</p>
    </div>

    <div id="propertiesForm" class="properties-form">
        <div class="element-info">
            <strong>Element:</strong> <span id="elementPath"></span>
        </div>

        <div class="form-group">
            <label for="tagName">Tag Name</label>
            <select id="tagName">
                <option value="div">div</option>
                <option value="section">section</option>
                <option value="article">article</option>
                <option value="header">header</option>
                <option value="footer">footer</option>
                <option value="nav">nav</option>
                <option value="aside">aside</option>
                <option value="main">main</option>
                <option value="p">p</option>
                <option value="span">span</option>
                <option value="a">a</option>
                <option value="button">button</option>
                <option value="input">input</option>
                <option value="form">form</option>
                <option value="ul">ul</option>
                <option value="ol">ol</option>
                <option value="li">li</option>
                <option value="h1">h1</option>
                <option value="h2">h2</option>
                <option value="h3">h3</option>
                <option value="h4">h4</option>
                <option value="h5">h5</option>
                <option value="h6">h6</option>
            </select>
            <small>HTML element tag</small>
        </div>

        <div class="form-group">
            <label for="className">Class</label>
            <input type="text" id="className" placeholder="e.g., btn btn-primary">
            <small>Space-separated class names</small>
        </div>

        <div class="form-group">
            <label for="elementId">ID</label>
            <input type="text" id="elementId" placeholder="e.g., main-content">
            <small>Unique element identifier</small>
        </div>

        <div class="code-preview-section">
            <h3>Code Preview</h3>
            <div id="monacoEditor"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let debounceTimers = {};
        let currentSelection = null;
        let currentCodeContext = null;
        let monacoEditor = null;
        let monacoLoaded = false;

        // Load Monaco Editor
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            monacoLoaded = true;
            monaco.editor.defineTheme('vscodeDark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#1e1e1e',
                }
            });
            monaco.editor.setTheme('vscodeDark');
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateProperties') {
                updatePropertiesUI(message.selection, message.codeContext);
            }
        });

        function updatePropertiesUI(selection, codeContext) {
            currentSelection = selection;
            currentCodeContext = codeContext;
            const placeholder = document.getElementById('placeholder');
            const form = document.getElementById('propertiesForm');

            if (!selection) {
                placeholder.style.display = 'block';
                form.classList.remove('active');
                return;
            }

            placeholder.style.display = 'none';
            form.classList.add('active');

            document.getElementById('elementPath').textContent =
                selection.filePath + ':' + selection.line + ':' + selection.character;

            const tagSelect = document.getElementById('tagName');
            const classInput = document.getElementById('className');
            const idInput = document.getElementById('elementId');

            if (selection.tagName) {
                tagSelect.value = selection.tagName.toLowerCase();
            }
            if (selection.attributes) {
                classInput.value = selection.attributes.class || '';
                idInput.value = selection.attributes.id || '';
            }

            // Update Monaco editor
            if (codeContext && monacoLoaded) {
                updateMonacoEditor(codeContext);
            }
        }

        function updateMonacoEditor(codeContext) {
            const editorContainer = document.getElementById('monacoEditor');

            if (!monacoEditor && monaco) {
                monacoEditor = monaco.editor.create(editorContainer, {
                    value: codeContext.code,
                    language: 'razor',
                    theme: 'vscodeDark',
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontSize: 13,
                    tabSize: 4
                });

                // Handle content changes
                monacoEditor.onDidChangeModelContent(() => {
                    handleCodeChange();
                });
            } else if (monacoEditor) {
                monacoEditor.setValue(codeContext.code);
            }

            // Scroll to center the selected line
            if (monacoEditor && currentSelection) {
                const selectedLineInEditor = currentSelection.line - codeContext.startLine + 1;
                monacoEditor.revealLineInCenter(selectedLineInEditor);
            }
        }

        function handleCodeChange() {
            if (!monacoEditor || !currentCodeContext) return;

            if (debounceTimers.code) {
                clearTimeout(debounceTimers.code);
            }

            debounceTimers.code = setTimeout(() => {
                const newCode = monacoEditor.getValue();
                vscode.postMessage({
                    type: 'codeChanged',
                    code: newCode,
                    startLine: currentCodeContext.startLine,
                    endLine: currentCodeContext.endLine,
                    selection: currentSelection
                });
            }, 300);
        }

        function handleAttributeChange(attributeName, value) {
            if (!currentSelection) return;

            if (debounceTimers[attributeName]) {
                clearTimeout(debounceTimers[attributeName]);
            }

            debounceTimers[attributeName] = setTimeout(() => {
                vscode.postMessage({
                    type: 'attributeChanged',
                    attribute: attributeName,
                    value: value,
                    selection: currentSelection
                });
            }, 300);
        }

        document.getElementById('tagName').addEventListener('change', (e) => {
            handleAttributeChange('tagName', e.target.value);
        });

        document.getElementById('className').addEventListener('input', (e) => {
            handleAttributeChange('class', e.target.value);
        });

        document.getElementById('elementId').addEventListener('input', (e) => {
            handleAttributeChange('id', e.target.value);
        });
    </script>
</body>
</html>`;
    }
}
