import { describe, it, beforeEach } from 'mocha';
import * as assert from 'assert';
import { ToolboxPanel } from '../../toolboxPanel';
import { SelectionStateManager } from '../../selectionStateManager';

describe('ToolboxPanel', () => {
    let toolboxPanel: ToolboxPanel;
    let mockExtensionUri: any;
    let selectionManager: SelectionStateManager;

    beforeEach(() => {
        mockExtensionUri = { fsPath: '/mock/path' };
        selectionManager = SelectionStateManager.getInstance();
        toolboxPanel = new ToolboxPanel(mockExtensionUri, selectionManager);
    });

    describe('Panel Creation', () => {
        it('Should create toolbox panel instance', () => {
            assert.ok(toolboxPanel);
            assert.strictEqual(typeof toolboxPanel.show, 'function');
            assert.strictEqual(typeof toolboxPanel.dispose, 'function');
        });

        it('Should generate HTML content with component categories', () => {
            const html = (toolboxPanel as any).getHtmlContent();

            assert.ok(html.includes('Toolbox'));
            assert.ok(html.includes('HTML'));
            assert.ok(html.includes('Bootstrap'));
            assert.ok(html.includes('Razor'));
        });

        it('Should include draggable components in HTML', () => {
            const html = (toolboxPanel as any).getHtmlContent();

            // Check for basic HTML components
            assert.ok(html.includes('Button'));
            assert.ok(html.includes('Input'));
            assert.ok(html.includes('Div'));

            // Check draggable attribute
            assert.ok(html.includes('draggable="true"'));
        });
    });

    describe('Component Catalog', () => {
        it('Should define standard HTML components', () => {
            const components = (toolboxPanel as any).getComponents();

            const buttonComponent = components.find((c: any) => c.id === 'html-button');
            assert.ok(buttonComponent);
            assert.strictEqual(buttonComponent.category, 'html');
            assert.ok(buttonComponent.template.includes('<button'));
        });

        it('Should define Bootstrap components', () => {
            const components = (toolboxPanel as any).getComponents();

            const cardComponent = components.find((c: any) => c.id === 'bootstrap-card');
            assert.ok(cardComponent);
            assert.strictEqual(cardComponent.category, 'bootstrap');
            assert.ok(cardComponent.template.includes('class="card"'));
        });

        it('Should define Razor components', () => {
            const components = (toolboxPanel as any).getComponents();

            const foreachComponent = components.find((c: any) => c.id === 'razor-foreach');
            assert.ok(foreachComponent);
            assert.strictEqual(foreachComponent.category, 'razor');
            assert.ok(foreachComponent.template.includes('@foreach'));
        });
    });

    describe('Disposal', () => {
        it('Should dispose panel and clean up resources', () => {
            toolboxPanel.dispose();

            // After disposal, panel should be null
            assert.strictEqual((toolboxPanel as any).panel, null);
        });
    });
});
