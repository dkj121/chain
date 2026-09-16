import { describe, it, beforeEach } from 'mocha';
import * as assert from 'assert';
import { DropEventHandler } from '../../dropEventHandler';
import { DropZoneHandler } from '../../dropZoneHandler';
import { RazorCodeInserter } from '../../razorCodeInserter';
import { Component } from '../../toolboxPanel';

describe('DropEventHandler', () => {
    let dropEventHandler: DropEventHandler;
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
            }
        ];
        dropZoneHandler = new DropZoneHandler(mockCodeInserter, allowedComponents);
        dropEventHandler = new DropEventHandler(dropZoneHandler, allowedComponents);
    });

    describe('Message Handling', () => {
        it('Should reject drop when no workspace open', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/path/to/file.cshtml:10:4',
                position: 'before'
            };

            // Should throw workspace error
            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('No workspace folder open'));
            }
        });

        it('Should parse data-chain-src format', () => {
            const targetSrc = '/path/to/file.cshtml:10:4';

            const parsed = (dropEventHandler as any).parseDataClainSrc(targetSrc);

            assert.strictEqual(parsed.file, '/path/to/file.cshtml');
            assert.strictEqual(parsed.line, 10);
            assert.strictEqual(parsed.character, 4);
        });

        it('Should reject invalid data-chain-src format', () => {
            const invalidSrc = 'invalid-format';

            assert.throws(() => {
                (dropEventHandler as any).parseDataClainSrc(invalidSrc);
            }, /Invalid data-chain-src format/);
        });

        it('Should find component by ID', () => {
            const component = (dropEventHandler as any).findComponent('html-button');

            assert.ok(component);
            assert.strictEqual(component.id, 'html-button');
        });

        it('Should return null for unknown component ID', () => {
            const component = (dropEventHandler as any).findComponent('unknown-id');

            assert.strictEqual(component, null);
        });
    });

    describe('Drop Context Extraction', () => {
        it('Should extract context from message', () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/path/to/file.cshtml:10:4',
                position: 'before',
                context: {
                    parentElement: 'div',
                    siblingElements: ['p', 'span']
                }
            };

            const context = (dropEventHandler as any).extractContext(message);

            assert.strictEqual(context.parentElement, 'div');
            assert.strictEqual(context.siblingElements.length, 2);
        });

        it('Should provide default context when missing', () => {
            const message = {
                command: 'drop',
                componentId: 'html-button',
                targetSrc: '/path/to/file.cshtml:10:4',
                position: 'before'
            };

            const context = (dropEventHandler as any).extractContext(message);

            assert.strictEqual(context.parentElement, '');
            assert.ok(Array.isArray(context.siblingElements));
        });
    });

    describe('Message Validation', () => {
        it('Should reject message without command', async () => {
            const message = {
                componentId: 'html-button'
            };

            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('Invalid message'));
            }
        });

        it('Should reject message without componentId', async () => {
            const message = {
                command: 'drop',
                targetSrc: '/path/to/file.cshtml:10:4'
            };

            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('componentId'));
            }
        });

        it('Should reject message without targetSrc', async () => {
            const message = {
                command: 'drop',
                componentId: 'html-button'
            };

            try {
                await dropEventHandler.handleMessage(message);
                assert.fail('Should have thrown error');
            } catch (error: any) {
                assert.ok(error.message.includes('targetSrc'));
            }
        });
    });
});
