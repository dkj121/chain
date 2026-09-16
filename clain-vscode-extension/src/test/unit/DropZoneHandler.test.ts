import { describe, it, beforeEach } from 'mocha';
import * as assert from 'assert';
import { DropZoneHandler } from '../../dropZoneHandler';
import { RazorCodeInserter } from '../../razorCodeInserter';
import { DropInfo, Component } from '../../toolboxPanel';

describe('DropZoneHandler', () => {
    let dropZoneHandler: DropZoneHandler;
    let mockCodeInserter: RazorCodeInserter;
    let allowedComponents: Component[];

    beforeEach(() => {
        mockCodeInserter = new RazorCodeInserter();
        allowedComponents = [
            {
                id: 'html-button',
                name: 'Button',
                category: 'html',
                template: '<button>Click me</button>',
                icon: '🔘'
            },
            {
                id: 'bootstrap-card',
                name: 'Card',
                category: 'bootstrap',
                template: '<div class="card"></div>',
                icon: '🃏'
            },
            {
                id: 'razor-foreach',
                name: 'ForEach',
                category: 'razor',
                template: '@foreach (var item in Model) { }',
                icon: '🔁'
            }
        ];
        dropZoneHandler = new DropZoneHandler(mockCodeInserter, allowedComponents);
    });

    describe('Target Location Parsing', () => {
        it('Should parse "before" position correctly', () => {
            const result = (dropZoneHandler as any).parseTargetLocation(
                '/path/to/file.cshtml',
                10,
                4,
                'before'
            );

            assert.strictEqual(result.file, '/path/to/file.cshtml');
            assert.strictEqual(result.line, 10);
            assert.strictEqual(result.character, 4);
            assert.strictEqual(result.indentation, '    ');
        });

        it('Should parse "after" position correctly', () => {
            const result = (dropZoneHandler as any).parseTargetLocation(
                '/path/to/file.cshtml',
                10,
                4,
                'after'
            );

            assert.strictEqual(result.line, 11); // Next line
            assert.strictEqual(result.character, 0);
        });

        it('Should parse "inside" position correctly', () => {
            const result = (dropZoneHandler as any).parseTargetLocation(
                '/path/to/file.cshtml',
                10,
                4,
                'inside'
            );

            assert.strictEqual(result.line, 11); // Next line
            assert.strictEqual(result.character, 0);
        });
    });

    describe('Indentation Detection', () => {
        it('Should detect indentation from character position', () => {
            const indentation = (dropZoneHandler as any).detectIndentationLevel(8);

            assert.strictEqual(indentation, '        ');
        });

        it('Should handle zero indentation', () => {
            const indentation = (dropZoneHandler as any).detectIndentationLevel(0);

            assert.strictEqual(indentation, '');
        });

        it('Should handle negative positions as zero', () => {
            const indentation = (dropZoneHandler as any).detectIndentationLevel(-5);

            assert.strictEqual(indentation, '');
        });

        it('Should cap indentation at MAX_INDENTATION (200)', () => {
            const indentation = (dropZoneHandler as any).detectIndentationLevel(500);

            assert.strictEqual(indentation.length, 200);
            assert.strictEqual(indentation, ' '.repeat(200));
        });
    });

    describe('Drop Target Validation', () => {
        it('Should allow HTML components anywhere', () => {
            const context: DropInfo['context'] = {
                parentElement: 'div',
                siblingElements: ['p', 'span'],
                razorBlock: undefined
            };

            const isValid = dropZoneHandler.isValidDropTarget('html', context);

            assert.strictEqual(isValid, true);
        });

        it('Should allow Bootstrap components anywhere', () => {
            const context: DropInfo['context'] = {
                parentElement: 'div',
                siblingElements: [],
                razorBlock: undefined
            };

            const isValid = dropZoneHandler.isValidDropTarget('bootstrap', context);

            assert.strictEqual(isValid, true);
        });

        it('Should reject Razor components outside Razor blocks', () => {
            const context: DropInfo['context'] = {
                parentElement: 'div',
                siblingElements: [],
                razorBlock: undefined
            };

            const isValid = dropZoneHandler.isValidDropTarget('razor', context);

            assert.strictEqual(isValid, false);
        });

        it('Should allow Razor components inside Razor blocks', () => {
            const context: DropInfo['context'] = {
                parentElement: 'div',
                siblingElements: [],
                razorBlock: '@foreach'
            };

            const isValid = dropZoneHandler.isValidDropTarget('razor', context);

            assert.strictEqual(isValid, true);
        });
    });

    describe('Drop Handling Integration', () => {
        it('Should reject drop when no workspace open', async () => {
            const dropInfo: DropInfo = {
                componentId: 'html-button',
                targetFile: '/path/to/file.cshtml',
                targetLine: 10,
                targetChar: 4,
                position: 'before',
                context: {
                    parentElement: 'div',
                    siblingElements: [],
                    razorBlock: undefined
                }
            };

            const component: Component = {
                id: 'html-button',
                name: 'Button',
                category: 'html',
                template: '<button>Click me</button>',
                icon: '🔘'
            };

            // Should throw when no workspace is open
            try {
                await dropZoneHandler.handleDrop(dropInfo, component);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });

        it('Should reject unknown component ID', async () => {
            const dropInfo: DropInfo = {
                componentId: 'unknown-component',
                targetFile: '/path/to/file.cshtml',
                targetLine: 10,
                targetChar: 4,
                position: 'before',
                context: {
                    parentElement: 'div',
                    siblingElements: [],
                    razorBlock: undefined
                }
            };

            const unknownComponent: Component = {
                id: 'unknown-component',
                name: 'Unknown',
                category: 'html',
                template: '<div>Unknown</div>',
                icon: '❓'
            };

            try {
                await dropZoneHandler.handleDrop(dropInfo, unknownComponent);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('Unknown component ID'));
            }
        });

        it('Should reject component data tampering', async () => {
            const dropInfo: DropInfo = {
                componentId: 'html-button',
                targetFile: '/path/to/file.cshtml',
                targetLine: 10,
                targetChar: 4,
                position: 'before',
                context: {
                    parentElement: 'div',
                    siblingElements: [],
                    razorBlock: undefined
                }
            };

            const tamperedComponent: Component = {
                id: 'html-button',
                name: 'Button',
                category: 'html',
                template: '<script>alert("xss")</script>', // Tampered template
                icon: '🔘'
            };

            try {
                await dropZoneHandler.handleDrop(dropInfo, tamperedComponent);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('Component data mismatch'));
            }
        });
    });
});
