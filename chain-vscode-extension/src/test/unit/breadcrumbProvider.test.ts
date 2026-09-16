import * as assert from 'assert';
import { BreadcrumbProvider } from '../../breadcrumbProvider';
import { RazorAstParser, RazorNode } from '../../razorAstParser';
import { SelectionStateManager, ElementSelection } from '../../selectionStateManager';

suite('BreadcrumbProvider Unit Tests', () => {
    let breadcrumbProvider: BreadcrumbProvider;
    let mockParser: RazorAstParser;
    let selectionManager: SelectionStateManager;

    setup(() => {
        // Create mock parser
        mockParser = {
            getAncestry: async (filePath: string, line: number, char: number) => {
                return {
                    ancestors: [
                        {
                            kind: 'HtmlElement',
                            content: '<div class="container">',
                            filePath: filePath,
                            line: 0,
                            character: 0
                        },
                        {
                            kind: 'HtmlElement',
                            content: '<section id="main">',
                            filePath: filePath,
                            line: 1,
                            character: 4
                        },
                        {
                            kind: 'HtmlElement',
                            content: '<div class="card">',
                            filePath: filePath,
                            line: line,
                            character: char
                        }
                    ]
                };
            },
            dispose: () => {}
        } as any;

        breadcrumbProvider = new BreadcrumbProvider(mockParser);
        selectionManager = SelectionStateManager.getInstance();
    });

    teardown(() => {
        breadcrumbProvider.dispose();
        selectionManager.clearSelection();
    });

    test('Should update breadcrumb on selection change', (done) => {
        breadcrumbProvider.onBreadcrumbUpdate((breadcrumb: RazorNode[]) => {
            assert.ok(breadcrumb.length > 0, 'Breadcrumb should have items');
            assert.strictEqual(breadcrumb.length, 3, 'Should have 3 ancestors');
            done();
        });

        const selection: ElementSelection = {
            filePath: 'test.cshtml',
            line: 5,
            character: 10,
            tagName: 'div'
        };

        selectionManager.setSelection(selection);
    });

    test('Should format HTML element with class and id', () => {
        const node: RazorNode = {
            kind: 'HtmlElement',
            content: '<div class="card" id="main-card">',
            filePath: 'test.cshtml',
            line: 5,
            character: 0
        };

        const formatted = breadcrumbProvider.formatNode(node);
        assert.strictEqual(formatted, 'div.card#main-card');
    });

    test('Should format HTML element with class only', () => {
        const node: RazorNode = {
            kind: 'HtmlElement',
            content: '<section class="container">',
            filePath: 'test.cshtml',
            line: 5,
            character: 0
        };

        const formatted = breadcrumbProvider.formatNode(node);
        assert.strictEqual(formatted, 'section.container');
    });

    test('Should format HTML element with id only', () => {
        const node: RazorNode = {
            kind: 'HtmlElement',
            content: '<div id="header">',
            filePath: 'test.cshtml',
            line: 5,
            character: 0
        };

        const formatted = breadcrumbProvider.formatNode(node);
        assert.strictEqual(formatted, 'div#header');
    });

    test('Should format C# block', () => {
        const node: RazorNode = {
            kind: 'CSharpBlock',
            content: '@foreach(var item in Model.Items)',
            filePath: 'test.cshtml',
            line: 5,
            character: 0
        };

        const formatted = breadcrumbProvider.formatNode(node);
        assert.strictEqual(formatted, '@foreach(var item in Model.Items)');
    });

    test('Should clear breadcrumb when selection is null', (done) => {
        let updateCount = 0;

        breadcrumbProvider.onBreadcrumbUpdate((breadcrumb: RazorNode[]) => {
            updateCount++;

            if (updateCount === 1) {
                // First update with selection
                assert.ok(breadcrumb.length > 0);
                selectionManager.setSelection(null);
            } else if (updateCount === 2) {
                // Second update with null selection
                assert.strictEqual(breadcrumb.length, 0, 'Breadcrumb should be empty');
                done();
            }
        });

        const selection: ElementSelection = {
            filePath: 'test.cshtml',
            line: 5,
            character: 10,
            tagName: 'div'
        };

        selectionManager.setSelection(selection);
    });

    test('Should handle race condition with rapid selection changes', async () => {
        let updateCount = 0;
        let lastBreadcrumb: RazorNode[] = [];

        breadcrumbProvider.onBreadcrumbUpdate((breadcrumb: RazorNode[]) => {
            updateCount++;
            lastBreadcrumb = breadcrumb;
        });

        // Trigger multiple rapid selection changes
        for (let i = 0; i < 5; i++) {
            const selection: ElementSelection = {
                filePath: 'test.cshtml',
                line: i,
                character: 0,
                tagName: 'div'
            };
            selectionManager.setSelection(selection);
        }

        // Wait for async updates to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should have received updates, but not necessarily all 5
        assert.ok(updateCount > 0, 'Should have received at least one update');
        assert.ok(lastBreadcrumb.length > 0, 'Last breadcrumb should have content');
    });
});
