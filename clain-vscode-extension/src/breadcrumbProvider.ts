import * as vscode from 'vscode';
import { RazorAstParser, RazorNode } from './razorAstParser';
import { SelectionStateManager, ElementSelection } from './selectionStateManager';

/**
 * Provides breadcrumb navigation for selected elements.
 * Displays ancestry chain including HTML elements and C# blocks.
 */
export class BreadcrumbProvider implements vscode.Disposable {
    private razorParser: RazorAstParser;
    private selectionManager: SelectionStateManager;
    private currentBreadcrumb: RazorNode[] = [];
    private onBreadcrumbUpdateEmitter = new vscode.EventEmitter<RazorNode[]>();
    private currentRequestId = 0;

    public readonly onBreadcrumbUpdate = this.onBreadcrumbUpdateEmitter.event;

    constructor(razorParser: RazorAstParser) {
        this.razorParser = razorParser;
        this.selectionManager = SelectionStateManager.getInstance();

        // Listen for selection changes
        this.selectionManager.onSelectionChange(async (selection) => {
            if (selection) {
                await this.updateBreadcrumb(selection);
            } else {
                this.currentBreadcrumb = [];
                this.onBreadcrumbUpdateEmitter.fire([]);
            }
        });
    }

    /**
     * Update breadcrumb based on current selection.
     */
    private async updateBreadcrumb(selection: ElementSelection): Promise<void> {
        // Increment request ID to track latest request
        const requestId = ++this.currentRequestId;

        try {
            const ancestry = await this.razorParser.getAncestry(
                selection.filePath,
                selection.line,
                selection.character
            );

            // Only update if this is still the latest request
            if (requestId === this.currentRequestId) {
                if (ancestry && ancestry.ancestors.length > 0) {
                    this.currentBreadcrumb = this.processBreadcrumb(ancestry.ancestors);
                    this.onBreadcrumbUpdateEmitter.fire(this.currentBreadcrumb);
                }
            }
        } catch (error) {
            // Only report error if this is still the latest request
            if (requestId === this.currentRequestId) {
                console.error('Error updating breadcrumb:', error);
                vscode.window.showErrorMessage('Failed to update breadcrumb navigation');
            }
        }
    }

    /**
     * Process breadcrumb chain - collapse if too deep, format nodes.
     */
    private processBreadcrumb(ancestors: RazorNode[]): RazorNode[] {
        const MAX_DEPTH = 10;

        if (ancestors.length <= MAX_DEPTH) {
            return ancestors;
        }

        // Collapse middle nodes if chain is too long
        const start = ancestors.slice(0, 3);
        const end = ancestors.slice(-5);
        const collapsed: RazorNode = {
            kind: 'Collapsed',
            filePath: '',
            line: 0,
            character: 0,
            content: '...'
        };

        return [...start, collapsed, ...end];
    }

    /**
     * Format a breadcrumb node for display.
     */
    public formatNode(node: RazorNode): string {
        switch (node.kind) {
            case 'Document':
                return this.getFileName(node.filePath);
            case 'HtmlElement':
                return this.formatHtmlElement(node);
            case 'CSharpBlock':
                return this.formatCSharpBlock(node);
            case 'Collapsed':
                return '...';
            default:
                return node.kind;
        }
    }

    /**
     * Format HTML element for breadcrumb (e.g., "div.card#main").
     */
    private formatHtmlElement(node: RazorNode): string {
        if (!node.content) {
            return 'element';
        }

        // Parse tag name and attributes from content
        const tagMatch = node.content.match(/<(\w+)/);
        const tagName = tagMatch ? tagMatch[1] : 'element';

        // Extract class attribute
        const classMatch = node.content.match(/class="([^"]*)"/);
        const classes = classMatch ? classMatch[1].split(' ').filter(c => c).map(c => '.' + c).join('') : '';

        // Extract id attribute
        const idMatch = node.content.match(/id="([^"]*)"/);
        const id = idMatch ? '#' + idMatch[1] : '';

        return `${tagName}${classes}${id}`;
    }

    /**
     * Format C# block for breadcrumb (e.g., "@foreach(var item in Model)").
     */
    private formatCSharpBlock(node: RazorNode): string {
        if (!node.content) {
            return '@block';
        }

        // Simplify long C# expressions
        let content = node.content.trim();
        if (content.length > 40) {
            content = content.substring(0, 37) + '...';
        }

        return content;
    }

    /**
     * Get file name from path.
     */
    private getFileName(filePath: string): string {
        const parts = filePath.split(/[\\/]/);
        return parts[parts.length - 1];
    }

    /**
     * Get current breadcrumb chain.
     */
    public getCurrentBreadcrumb(): RazorNode[] {
        return this.currentBreadcrumb;
    }

    /**
     * Handle breadcrumb level click - select that ancestor.
     */
    public async selectBreadcrumbLevel(index: number): Promise<void> {
        if (index < 0 || index >= this.currentBreadcrumb.length) {
            return;
        }

        const node = this.currentBreadcrumb[index];

        // Skip collapsed nodes
        if (node.kind === 'Collapsed') {
            return;
        }

        // Update selection to this node
        const selection: ElementSelection = {
            filePath: node.filePath,
            line: node.line,
            character: node.character,
            tagName: this.extractTagName(node) || 'div',
            attributes: this.extractAttributes(node)
        };

        this.selectionManager.setSelection(selection);

        // Navigate editor to this position
        await this.navigateToPosition(node.filePath, node.line, node.character);
    }

    /**
     * Navigate editor to a specific position.
     */
    private async navigateToPosition(
        filePath: string,
        line: number,
        character: number
    ): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);
            const position = new vscode.Position(line, character);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        } catch (error) {
            console.error('Error navigating to position:', error);
        }
    }

    /**
     * Extract tag name from node.
     */
    private extractTagName(node: RazorNode): string | undefined {
        if (node.kind !== 'HtmlElement' || !node.content) {
            return undefined;
        }

        const tagMatch = node.content.match(/<(\w+)/);
        return tagMatch ? tagMatch[1] : undefined;
    }

    /**
     * Extract attributes from node.
     */
    private extractAttributes(node: RazorNode): Record<string, string> | undefined {
        if (node.kind !== 'HtmlElement' || !node.content) {
            return undefined;
        }

        const attributes: Record<string, string> = {};

        const classMatch = node.content.match(/class="([^"]*)"/);
        if (classMatch) {
            attributes.class = classMatch[1];
        }

        const idMatch = node.content.match(/id="([^"]*)"/);
        if (idMatch) {
            attributes.id = idMatch[1];
        }

        return Object.keys(attributes).length > 0 ? attributes : undefined;
    }

    public dispose(): void {
        this.onBreadcrumbUpdateEmitter.dispose();
    }
}
