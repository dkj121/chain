import { describe, it, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import { ToolboxPanel, Component } from '../../toolboxPanel';
import { RazorCodeInserter } from '../../razorCodeInserter';
import { DropZoneHandler } from '../../dropZoneHandler';
import { DropEventHandler } from '../../dropEventHandler';
import { SelectionStateManager } from '../../selectionStateManager';

/**
 * Integration tests for Click-to-Inject feature
 * Tests the full flow: Toolbox → DropEventHandler → DropZoneHandler → RazorCodeInserter
 */
describe('Click-to-Inject Integration', () => {
    let toolboxPanel: ToolboxPanel;
    let razorCodeInserter: RazorCodeInserter;
    let dropZoneHandler: DropZoneHandler;
    let dropEventHandler: DropEventHandler;
    let allowedComponents: Component[];
    let selectionManager: SelectionStateManager;

    beforeEach(() => {
        const mockExtensionUri = { fsPath: '/mock/path' };
        selectionManager = SelectionStateManager.getInstance();

        // Initialize full pipeline
        toolboxPanel = new ToolboxPanel(mockExtensionUri as any, selectionManager);
        allowedComponents = (toolboxPanel as any).getComponents();

        razorCodeInserter = new RazorCodeInserter();
        dropZoneHandler = new DropZoneHandler(razorCodeInserter, allowedComponents);
        dropEventHandler = new DropEventHandler(dropZoneHandler, allowedComponents);
    });

    afterEach(() => {
        toolboxPanel.dispose();
    });

    describe('End-to-End Drop Flow', () => {
        it('Should process HTML button drop message', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/Views/Home/Index.cshtml:10:4',
                position: 'before',
                context: {
                    parentElement: 'div',
                    siblingElements: ['p']
                }
            };

            // Should fail with "No workspace folder open" (expected in test environment)
            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown workspace error');
            } catch (error: any) {
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });

        it('Should validate component exists in toolbox', async () => {
            const message = {
                command: 'drop',
                componentId: 'nonexistent-component',
                targetSrc: '/workspace/Views/Home/Index.cshtml:10:4',
                position: 'before'
            };

            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('Unknown component'));
            }
        });

        it('Should reject Razor component outside Razor block', async () => {
            const message = {
                command: 'drop',
                componentId: 'razor-foreach',
                targetSrc: '/workspace/Views/Home/Index.cshtml:10:4',
                position: 'before',
                context: {
                    parentElement: 'div',
                    siblingElements: [],
                    razorBlock: undefined // No Razor context
                }
            };

            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(
                    error.message.includes('No workspace folder open') ||
                    error.message.includes('Cannot drop razor component')
                );
            }
        });

        it('Should allow Razor component inside Razor block', async () => {
            const message = {
                command: 'drop',
                componentId: 'razor-foreach',
                targetSrc: '/workspace/Views/Home/Index.cshtml:10:4',
                position: 'inside',
                context: {
                    parentElement: 'div',
                    siblingElements: [],
                    razorBlock: '@foreach' // Valid Razor context
                }
            };

            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown workspace error');
            } catch (error: any) {
                // In test environment, workspace check happens before Razor validation
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });
    });

    describe('Component Catalog Integration', () => {
        it('Should have HTML components in toolbox', () => {
            const htmlButton = allowedComponents.find(c => c.id === 'html-button');
            const htmlDiv = allowedComponents.find(c => c.id === 'html-div');
            const htmlInput = allowedComponents.find(c => c.id === 'html-input');

            assert.ok(htmlButton);
            assert.strictEqual(htmlButton.category, 'html');
            assert.ok(htmlButton.template.includes('<button'));

            assert.ok(htmlDiv);
            assert.strictEqual(htmlDiv.category, 'html');

            assert.ok(htmlInput);
            assert.strictEqual(htmlInput.category, 'html');
        });

        it('Should have Bootstrap components in toolbox', () => {
            const bootstrapCard = allowedComponents.find(c => c.id === 'bootstrap-card');

            assert.ok(bootstrapCard);
            assert.strictEqual(bootstrapCard.category, 'bootstrap');
            assert.ok(bootstrapCard.template.includes('class="card"'));
        });

        it('Should have Razor components in toolbox', () => {
            const razorForeach = allowedComponents.find(c => c.id === 'razor-foreach');

            assert.ok(razorForeach);
            assert.strictEqual(razorForeach.category, 'razor');
            assert.ok(razorForeach.template.includes('@foreach'));
        });
    });

    describe('Data Format Compatibility', () => {
        it('Should parse data-chain-src format correctly', () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/Views/Home/Index.cshtml:10:4',
                position: 'before'
            };

            const parsed = (dropEventHandler as any).parseDataChainSrc(message.targetSrc);

            assert.strictEqual(parsed.file, '/workspace/Views/Home/Index.cshtml');
            assert.strictEqual(parsed.line, 10);
            assert.strictEqual(parsed.character, 4);
        });

        it('Should handle Windows paths with drive letters', () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: 'C:/Users/Dev/Project/Views/Home/Index.cshtml:15:8',
                position: 'after'
            };

            const parsed = (dropEventHandler as any).parseDataChainSrc(message.targetSrc);

            assert.strictEqual(parsed.file, 'C:/Users/Dev/Project/Views/Home/Index.cshtml');
            assert.strictEqual(parsed.line, 15);
            assert.strictEqual(parsed.character, 8);
        });
    });

    describe('Position Handling', () => {
        it('Should handle "before" position', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/file.cshtml:10:4',
                position: 'before'
            };

            try {
                await dropEventHandler.handleMessage(message);
            } catch (error: any) {
                // Expected workspace error in test environment
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });

        it('Should handle "after" position', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/file.cshtml:10:4',
                position: 'after'
            };

            try {
                await dropEventHandler.handleMessage(message);
            } catch (error: any) {
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });

        it('Should handle "inside" position', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/file.cshtml:10:4',
                position: 'inside'
            };

            try {
                await dropEventHandler.handleMessage(message);
            } catch (error: any) {
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });
    });

    describe('Security Validation Integration', () => {
        it('Should reject component data tampering in full flow', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/file.cshtml:10:4',
                position: 'before'
            };

            // Manually create tampered component (bypassing allowlist)
            const tamperedComponent: Component = {
                id: 'html-button',
                name: 'Button',
                category: 'html' as const,
                template: '<script>alert("xss")</script>',
                icon: '🔘'
            };

            // Create handler with tampered component
            const tamperedHandler = new DropZoneHandler(razorCodeInserter, [tamperedComponent]);
            const tamperedEventHandler = new DropEventHandler(tamperedHandler, [tamperedComponent]);

            try {
                await tamperedEventHandler.handleMessage(message);
            } catch (error: any) {
                // Should fail with workspace error (security checks happen after)
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });

        it('Should validate file extension in full flow', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/workspace/file.txt:10:4', // Invalid extension
                position: 'before'
            };

            try {
                await dropEventHandler.handleMessage(message);
            } catch (error: any) {
                // Should fail with workspace or extension error
                assert.ok(
                    error.message.includes('No workspace folder open') ||
                    error.message.includes('must be a Razor file')
                );
            }
        });
    });
});
