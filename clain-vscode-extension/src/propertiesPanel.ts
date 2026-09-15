import * as vscode from 'vscode';
import { SelectionStateManager, ElementSelection } from './selectionStateManager';
import * as path from 'path';

interface CodeChangedMessage {
    type: 'codeChanged';
    code: string;
    startLine: number;
    endLine: number;
    selection: ElementSelection;
}

interface AttributeChangedMessage {
    type: 'attributeChanged';
    attribute: string;
    value: string;
    selection: ElementSelection;
}

interface StyleChangedMessage {
    type: 'styleChanged';
    property: string;
    value: string;
    selection: ElementSelection;
}

type WebviewMessage = CodeChangedMessage | AttributeChangedMessage | StyleChangedMessage;

/**
 * Provides the Properties Panel webview that displays element properties.
 * Initially shows a placeholder message until an element is selected.
 */
export class PropertiesPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clain.propertiesPanel';
    private static readonly MAX_CODE_SIZE = 50000; // 50KB limit for code edits
    private static readonly MONACO_VERSION = '0.44.0';

    private webviewView?: vscode.WebviewView;
    private selectionManager = SelectionStateManager.getInstance();
    private currentSelection: ElementSelection | null = null;
    private currentCodeContext: { startLine: number; endLine: number } | null = null;
    private logger: vscode.OutputChannel;

    constructor() {
        this.logger = vscode.window.createOutputChannel('Clain - Properties Panel');
    }

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

        // Track current selection for validation
        this.currentSelection = selection;

        let codeContext = null;
        if (selection) {
            codeContext = await this.extractCodeContext(selection);
            this.currentCodeContext = codeContext ? { startLine: codeContext.startLine, endLine: codeContext.endLine } : null;
        } else {
            this.currentCodeContext = null;
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
            this.logger.appendLine(`Failed to extract code context: ${error}`);
            return null;
        }
    }

    /**
     * Handle messages from the webview.
     */
    private async handleMessage(message: any): Promise<void> {
        // Validate message structure
        if (!message || typeof message.type !== 'string') {
            this.logger.appendLine('Invalid message format');
            return;
        }

        switch (message.type) {
            case 'attributeChanged':
                if (this.isAttributeChangedMessage(message)) {
                    await this.applyAttributeChange(message);
                }
                break;
            case 'codeChanged':
                if (this.isCodeChangedMessage(message)) {
                    await this.applyCodeChange(message);
                }
                break;
            case 'styleChanged':
                if (this.isStyleChangedMessage(message)) {
                    await this.applyStyleChange(message);
                }
                break;
            case 'runStyleConsolidation':
                await this.runStyleConsolidation(message.filePath);
                break;
        }
    }

    /**
     * Type guard for AttributeChangedMessage.
     */
    private isAttributeChangedMessage(message: any): message is AttributeChangedMessage {
        return typeof message.attribute === 'string' &&
               typeof message.value === 'string' &&
               message.selection &&
               typeof message.selection.filePath === 'string';
    }

    /**
     * Type guard for CodeChangedMessage.
     */
    private isCodeChangedMessage(message: any): message is CodeChangedMessage {
        return typeof message.code === 'string' &&
               typeof message.startLine === 'number' &&
               typeof message.endLine === 'number' &&
               message.selection &&
               typeof message.selection.filePath === 'string';
    }

    /**
     * Type guard for StyleChangedMessage.
     */
    private isStyleChangedMessage(message: any): message is StyleChangedMessage {
        return typeof message.property === 'string' &&
               typeof message.value === 'string' &&
               message.selection &&
               typeof message.selection.filePath === 'string';
    }

    /**
     * Apply style changes to the source file by injecting/modifying inline style attribute.
     */
    private async applyStyleChange(message: StyleChangedMessage): Promise<void> {
        const { property, value, selection } = message;

        if (!selection || !selection.filePath) {
            return;
        }

        // Security validation: Ensure this matches the current tracked selection
        if (!this.currentSelection ||
            selection.filePath !== this.currentSelection.filePath ||
            selection.line !== this.currentSelection.line ||
            selection.character !== this.currentSelection.character) {
            this.logger.appendLine('Style change rejected: selection mismatch');
            vscode.window.showErrorMessage('Cannot apply style: selection has changed');
            return;
        }

        // Validate CSS property name (prevent injection)
        if (!/^[a-z-]+$/i.test(property)) {
            this.logger.appendLine(`Style change rejected: invalid property name "${property}"`);
            vscode.window.showErrorMessage('Invalid CSS property name');
            return;
        }

        // Validate file path is within workspace
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(selection.filePath));
        if (!workspaceFolder) {
            this.logger.appendLine('Style change rejected: file not in workspace');
            vscode.window.showErrorMessage('Cannot apply style: file is not in workspace');
            return;
        }

        try {
            const document = await vscode.workspace.openTextDocument(selection.filePath);
            const line = selection.line;
            const lineText = document.lineAt(line).text;

            // Inject or modify style attribute
            const newLineText = this.injectStyleAttribute(lineText, property, value);

            if (newLineText !== lineText) {
                const edit = new vscode.WorkspaceEdit();
                const range = new vscode.Range(line, 0, line, lineText.length);
                edit.replace(document.uri, range, newLineText);
                await vscode.workspace.applyEdit(edit);

                // Update inline style count after applying edit
                await this.updateInlineStyleCount(selection.filePath);
            }
        } catch (error) {
            this.logger.appendLine(`Failed to apply style change: ${error}`);
            vscode.window.showErrorMessage('Failed to apply style changes');
        }
    }

    /**
     * Inject or modify a CSS property in the style attribute of an HTML line.
     */
    private injectStyleAttribute(lineText: string, property: string, value: string): string {
        const tagMatch = lineText.match(/<(\w+)([^>]*)>/);
        if (!tagMatch) {
            return lineText;
        }

        const tagName = tagMatch[1];
        const attributesSection = tagMatch[2];

        // Check if style attribute exists
        const styleRegex = /style="([^"]*)"/i;
        const styleMatch = attributesSection.match(styleRegex);

        let newStyleValue = '';
        if (styleMatch) {
            // Parse existing styles
            const existingStyles = styleMatch[1];
            const styleMap = this.parseStyleString(existingStyles);

            if (value.trim() === '') {
                // Remove property if value is empty
                delete styleMap[property];
            } else {
                // Update property
                styleMap[property] = value;
            }

            newStyleValue = Object.entries(styleMap)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ');
        } else {
            // No existing style attribute, create new one
            if (value.trim() !== '') {
                newStyleValue = `${property}: ${value}`;
            }
        }

        let newAttributesSection = attributesSection;
        if (styleMatch) {
            // Replace existing style
            if (newStyleValue === '') {
                // Remove empty style attribute
                newAttributesSection = attributesSection.replace(styleRegex, '').replace(/\s+/g, ' ').trim();
            } else {
                newAttributesSection = attributesSection.replace(styleRegex, `style="${newStyleValue}"`);
            }
        } else {
            // Add new style attribute
            if (newStyleValue !== '') {
                newAttributesSection = attributesSection + ` style="${newStyleValue}"`;
            }
        }

        return lineText.replace(tagMatch[0], `<${tagName}${newAttributesSection}>`);
    }

    /**
     * Parse a style attribute string into a key-value map.
     */
    private parseStyleString(styleStr: string): Record<string, string> {
        const styleMap: Record<string, string> = {};
        const declarations = styleStr.split(';').map(s => s.trim()).filter(s => s);

        for (const decl of declarations) {
            const colonIndex = decl.indexOf(':');
            if (colonIndex > 0) {
                const property = decl.substring(0, colonIndex).trim();
                const value = decl.substring(colonIndex + 1).trim();
                styleMap[property] = value;
            }
        }

        return styleMap;
    }

    /**
     * Count inline style attributes in a file and notify webview.
     */
    private async updateInlineStyleCount(filePath: string): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const text = document.getText();

            // Count occurrences of style="..."
            const styleMatches = text.match(/style="[^"]*"/gi);
            const count = styleMatches ? styleMatches.length : 0;

            if (this.webviewView) {
                this.webviewView.webview.postMessage({
                    type: 'updateInlineStyleCount',
                    count: count,
                    filePath: filePath
                });
            }
        } catch (error) {
            this.logger.appendLine(`Failed to count inline styles: ${error}`);
        }
    }

    /**
     * Run style consolidation via Claude Code skill.
     */
    private async runStyleConsolidation(filePath: string): Promise<void> {
        try {
            // Open the file in the editor
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            // Show information message
            vscode.window.showInformationMessage(
                'Style consolidation will be implemented in Issue #21. Use Claude Code chat to manually trigger clain:style-consolidation skill.'
            );

            this.logger.appendLine(`Style consolidation requested for ${filePath}`);
        } catch (error) {
            this.logger.appendLine(`Failed to run style consolidation: ${error}`);
            vscode.window.showErrorMessage('Failed to run style consolidation');
        }
    }

    private async applyCodeChange(message: CodeChangedMessage): Promise<void> {
        const { code, startLine, endLine, selection } = message;

        // Security validation: Ensure this matches the current tracked selection
        if (!this.currentSelection ||
            !this.currentCodeContext ||
            selection.filePath !== this.currentSelection.filePath ||
            selection.line !== this.currentSelection.line ||
            selection.character !== this.currentSelection.character) {
            this.logger.appendLine('Code change rejected: selection mismatch');
            vscode.window.showErrorMessage('Cannot apply changes: selection has changed');
            return;
        }

        // Validate line numbers
        if (startLine < 0 || endLine < startLine ||
            startLine !== this.currentCodeContext.startLine ||
            endLine !== this.currentCodeContext.endLine) {
            this.logger.appendLine('Code change rejected: invalid line range');
            vscode.window.showErrorMessage('Cannot apply changes: invalid line range');
            return;
        }

        // Validate code size (max 50KB)
        if (code.length > PropertiesPanel.MAX_CODE_SIZE) {
            this.logger.appendLine(`Code change rejected: content too large (${code.length} bytes)`);
            vscode.window.showErrorMessage('Cannot apply changes: content exceeds size limit');
            return;
        }

        // Validate file path is within workspace
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(selection.filePath));
        if (!workspaceFolder) {
            this.logger.appendLine('Code change rejected: file not in workspace');
            vscode.window.showErrorMessage('Cannot apply changes: file is not in workspace');
            return;
        }

        // Validate file path doesn't contain path traversal
        const normalizedPath = path.normalize(selection.filePath);
        if (normalizedPath.includes('..') || !normalizedPath.startsWith(workspaceFolder.uri.fsPath)) {
            this.logger.appendLine('Code change rejected: invalid file path');
            vscode.window.showErrorMessage('Cannot apply changes: invalid file path');
            return;
        }

        try {
            const document = await vscode.workspace.openTextDocument(selection.filePath);

            // Final validation: ensure line numbers are within document bounds
            if (endLine >= document.lineCount) {
                this.logger.appendLine('Code change rejected: line number out of bounds');
                vscode.window.showErrorMessage('Cannot apply changes: line number out of bounds');
                return;
            }

            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
            edit.replace(document.uri, range, code);
            await vscode.workspace.applyEdit(edit);
        } catch (error) {
            this.logger.appendLine(`Failed to apply code change: ${error}`);
            vscode.window.showErrorMessage('Failed to apply code changes');
        }
    }

    /**
     * Apply attribute changes to the source file.
     */
    private async applyAttributeChange(message: AttributeChangedMessage): Promise<void> {
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
            this.logger.appendLine(`Failed to apply attribute change: ${error}`);
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
        const monacoVersion = PropertiesPanel.MONACO_VERSION;
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

        .monaco-error {
            padding: 12px;
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
            border-radius: 2px;
            font-size: 12px;
        }

        .quick-styles-section {
            margin-top: 24px;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 16px;
        }

        .quick-styles-section h3 {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
        }

        .style-category {
            margin-bottom: 16px;
        }

        .style-category-label {
            font-size: 11px;
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 6px;
            display: block;
        }

        .quick-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .quick-button {
            padding: 4px 10px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: background 0.15s ease;
        }

        .quick-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .quick-button:active {
            transform: translateY(1px);
        }

        .inline-style-warning {
            margin-top: 12px;
            padding: 10px;
            background-color: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            color: var(--vscode-inputValidation-warningForeground);
            border-radius: 3px;
            font-size: 11px;
            display: none;
        }

        .inline-style-warning.show {
            display: block;
        }

        .inline-style-warning strong {
            display: block;
            margin-bottom: 4px;
        }

        .inline-style-warning button {
            margin-top: 8px;
            padding: 4px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
        }

        .inline-style-warning button:hover {
            background: var(--vscode-button-hoverBackground);
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

        <div class="quick-styles-section">
            <h3>Quick Styles</h3>

            <div class="style-category">
                <span class="style-category-label">Display</span>
                <div class="quick-buttons">
                    <button class="quick-button" data-property="display" data-value="block">Block</button>
                    <button class="quick-button" data-property="display" data-value="inline-block">Inline Block</button>
                    <button class="quick-button" data-property="display" data-value="flex">Flex</button>
                    <button class="quick-button" data-property="display" data-value="grid">Grid</button>
                    <button class="quick-button" data-property="display" data-value="none">None</button>
                </div>
            </div>

            <div class="style-category">
                <span class="style-category-label">Text Align</span>
                <div class="quick-buttons">
                    <button class="quick-button" data-property="text-align" data-value="left">Left</button>
                    <button class="quick-button" data-property="text-align" data-value="center">Center</button>
                    <button class="quick-button" data-property="text-align" data-value="right">Right</button>
                    <button class="quick-button" data-property="text-align" data-value="justify">Justify</button>
                </div>
            </div>

            <div class="style-category">
                <span class="style-category-label">Font Weight</span>
                <div class="quick-buttons">
                    <button class="quick-button" data-property="font-weight" data-value="normal">Normal</button>
                    <button class="quick-button" data-property="font-weight" data-value="bold">Bold</button>
                    <button class="quick-button" data-property="font-weight" data-value="600">Semi-Bold</button>
                    <button class="quick-button" data-property="font-weight" data-value="300">Light</button>
                </div>
            </div>

            <div class="style-category">
                <span class="style-category-label">Spacing</span>
                <div class="quick-buttons">
                    <button class="quick-button" data-property="margin" data-value="0">No Margin</button>
                    <button class="quick-button" data-property="margin" data-value="8px">Margin 8px</button>
                    <button class="quick-button" data-property="margin" data-value="16px">Margin 16px</button>
                    <button class="quick-button" data-property="padding" data-value="8px">Padding 8px</button>
                    <button class="quick-button" data-property="padding" data-value="16px">Padding 16px</button>
                </div>
            </div>

            <div class="inline-style-warning" id="inlineStyleWarning">
                <strong>⚠️ Inline Styles Detected</strong>
                <p><span id="inlineStyleCount">0</span> inline style(s) in this file. Consider consolidating to CSS classes.</p>
                <button id="consolidateButton">Run Style Consolidation</button>
            </div>
        </div>

        <div class="code-preview-section">
            <h3>Code Preview</h3>
            <div id="monacoEditor"></div>
            <div id="monacoError" class="monaco-error" style="display: none;"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/min/vs/loader.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let debounceTimers = {};
        let currentSelection = null;
        let currentCodeContext = null;
        let monacoEditor = null;
        let monacoLoaded = false;

        // Load Monaco Editor with error handling
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@${monacoVersion}/min/vs' } });
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
        }, function(err) {
            // Handle Monaco load failure
            const errorDiv = document.getElementById('monacoError');
            errorDiv.textContent = 'Failed to load code editor: ' + (err.message || 'Unknown error');
            errorDiv.style.display = 'block';
            document.getElementById('monacoEditor').style.display = 'none';

            vscode.postMessage({
                type: 'monacoLoadFailed',
                error: err.message || 'Unknown error'
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateProperties') {
                updatePropertiesUI(message.selection, message.codeContext);
            } else if (message.type === 'updateInlineStyleCount') {
                updateInlineStyleWarning(message.count);
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

        // Quick style buttons
        document.querySelectorAll('.quick-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const property = e.target.getAttribute('data-property');
                const value = e.target.getAttribute('data-value');
                handleStyleChange(property, value);
            });
        });

        // Style consolidation button
        document.getElementById('consolidateButton').addEventListener('click', () => {
            vscode.postMessage({
                type: 'runStyleConsolidation',
                filePath: currentSelection?.filePath
            });
        });

        function handleStyleChange(property, value) {
            if (!currentSelection) {
                return;
            }

            // Clear debounce timer
            if (debounceTimers.style) {
                clearTimeout(debounceTimers.style);
            }

            // Debounce to avoid too many messages
            debounceTimers.style = setTimeout(() => {
                vscode.postMessage({
                    type: 'styleChanged',
                    property: property,
                    value: value,
                    selection: currentSelection
                });
            }, 300);
        }

        function updateInlineStyleWarning(count) {
            const warning = document.getElementById('inlineStyleWarning');
            const countSpan = document.getElementById('inlineStyleCount');

            countSpan.textContent = count;

            if (count > 3) {
                warning.classList.add('show');
            } else {
                warning.classList.remove('show');
            }
        }
    </script>
</body>
</html>`;
    }
}
