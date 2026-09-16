import { SelectionStateManager } from './selectionStateManager';

export interface Component {
    id: string;
    name: string;
    category: 'html' | 'bootstrap' | 'razor' | 'custom';
    template: string;
    icon: string;
}

export interface DropInfo {
    componentId: string;
    targetFile: string;
    targetLine: number;
    targetChar: number;
    position: 'before' | 'after' | 'inside';
    context: {
        parentElement: string;
        siblingElements: string[];
        razorBlock?: string;
    };
}

/**
 * ToolboxPanel manages a webview panel displaying draggable Razor/HTML components.
 * Users can drag components from this panel and drop them into the live preview,
 * triggering AI-powered code insertion into the appropriate .cshtml file.
 */
export class ToolboxPanel {
    private panel: any | null = null;
    private extensionUri: any;
    private selectionManager: SelectionStateManager;
    private components: Component[];

    constructor(extensionUri: any, selectionManager: SelectionStateManager) {
        this.extensionUri = extensionUri;
        this.selectionManager = selectionManager;
        this.components = this.initializeComponents();
    }

    public show(): void {
        // Implementation will create vscode.WebviewPanel in production
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
    }

    private getComponents(): Component[] {
        return this.components;
    }

    private initializeComponents(): Component[] {
        return [
            // HTML Components
            {
                id: 'html-button',
                name: 'Button',
                category: 'html',
                template: '<button type="button">Click me</button>',
                icon: '🔘'
            },
            {
                id: 'html-input',
                name: 'Input',
                category: 'html',
                template: '<input type="text" placeholder="Enter text" />',
                icon: '📝'
            },
            {
                id: 'html-div',
                name: 'Div',
                category: 'html',
                template: '<div>\n    Content here\n</div>',
                icon: '📦'
            },
            // Bootstrap Components
            {
                id: 'bootstrap-card',
                name: 'Card',
                category: 'bootstrap',
                template: '<div class="card" style="width: 18rem;">\n    <div class="card-body">\n        <h5 class="card-title">Card Title</h5>\n    </div>\n</div>',
                icon: '🃏'
            },
            // Razor Components
            {
                id: 'razor-foreach',
                name: 'Foreach Loop',
                category: 'razor',
                template: '@foreach (var item in Model.Items)\n{\n    <div>@item.Name</div>\n}',
                icon: '🔁'
            }
        ];
    }

    private getHtmlContent(): string {
        const htmlComponents = this.components.filter(c => c.category === 'html');
        const bootstrapComponents = this.components.filter(c => c.category === 'bootstrap');
        const razorComponents = this.components.filter(c => c.category === 'razor');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Clain Toolbox</title>
</head>
<body>
    <h1>Toolbox</h1>
    <h2>HTML</h2>
    ${this.renderComponents(htmlComponents)}
    <h2>Bootstrap</h2>
    ${this.renderComponents(bootstrapComponents)}
    <h2>Razor</h2>
    ${this.renderComponents(razorComponents)}
</body>
</html>`;
    }

    private renderComponents(components: Component[]): string {
        return components.map(c => `
            <div class="component" draggable="true" data-component-id="${c.id}">
                <span>${c.icon}</span>
                <span>${c.name}</span>
            </div>
        `).join('');
    }
}
