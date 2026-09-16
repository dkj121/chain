import { SelectionStateManager } from './selectionStateManager';
import { AIComponentSearch, SearchResult } from './aiComponentSearch';

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
    private aiSearch: AIComponentSearch;
    private searchResults: Component[] = [];

    constructor(extensionUri: any, selectionManager: SelectionStateManager) {
        this.extensionUri = extensionUri;
        this.selectionManager = selectionManager;
        this.components = this.initializeComponents();
        this.aiSearch = new AIComponentSearch();
        this.aiSearch.setLocalComponents(this.components);
    }

    /**
     * Set API key for AI-powered component search
     */
    public setApiKey(apiKey: string): void {
        this.aiSearch.setApiKey(apiKey);
    }

    /**
     * Search components using AI or keyword matching
     */
    public async searchComponents(query: string): Promise<Component[]> {
        if (!query.trim()) {
            this.searchResults = [];
            return this.components;
        }

        const results = await this.aiSearch.search(query);

        // Convert SearchResult to Component format
        this.searchResults = results.map((r, index) => ({
            id: r.id || `search-result-${index}`,
            name: r.name,
            category: (r.category as any) || 'custom',
            template: r.template,
            icon: r.icon || '🔍'
        }));

        return this.searchResults;
    }

    /**
     * Clear search results and return to full component list
     */
    public clearSearch(): void {
        this.searchResults = [];
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
        const displayComponents = this.searchResults.length > 0 ? this.searchResults : this.components;
        const htmlComponents = displayComponents.filter(c => c.category === 'html');
        const bootstrapComponents = displayComponents.filter(c => c.category === 'bootstrap');
        const razorComponents = displayComponents.filter(c => c.category === 'razor');
        const customComponents = displayComponents.filter(c => c.category === 'custom');

        const searchBox = `
            <div class="search-box">
                <input type="text" id="component-search" placeholder="Search components..." />
            </div>
        `;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Chain Toolbox</title>
    <style>
        .search-box {
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        #component-search {
            width: 100%;
            padding: 6px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }
        .component {
            padding: 8px;
            cursor: grab;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .component:hover {
            background: var(--vscode-list-hoverBackground);
        }
        h2 {
            font-size: 12px;
            text-transform: uppercase;
            padding: 8px;
            margin: 8px 0 0 0;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <h1 style="padding: 8px;">Toolbox</h1>
    ${searchBox}
    ${htmlComponents.length > 0 ? '<h2>HTML</h2>' + this.renderComponents(htmlComponents) : ''}
    ${bootstrapComponents.length > 0 ? '<h2>Bootstrap</h2>' + this.renderComponents(bootstrapComponents) : ''}
    ${razorComponents.length > 0 ? '<h2>Razor</h2>' + this.renderComponents(razorComponents) : ''}
    ${customComponents.length > 0 ? '<h2>Search Results</h2>' + this.renderComponents(customComponents) : ''}
    <script>
        const vscode = acquireVsCodeApi();
        const searchInput = document.getElementById('component-search');

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                vscode.postMessage({
                    command: 'search',
                    query: e.target.value
                });
            }, 300);
        });
    </script>
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
