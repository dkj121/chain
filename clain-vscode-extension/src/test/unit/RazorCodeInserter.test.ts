import { describe, it, beforeEach } from 'mocha';
import * as assert from 'assert';
import { RazorCodeInserter, InsertionPoint } from '../../razorCodeInserter';

describe('RazorCodeInserter', () => {
    let codeInserter: RazorCodeInserter;

    beforeEach(() => {
        codeInserter = new RazorCodeInserter();
    });

    describe('Template Formatting', () => {
        it('Should format template with indentation', () => {
            const template = '<button>Click me</button>';
            const indentation = '    ';

            const formatted = (codeInserter as any).formatTemplate(template, indentation);

            assert.strictEqual(formatted, '    <button>Click me</button>');
        });

        it('Should format multi-line template with indentation', () => {
            const template = '<div>\n    <p>Content</p>\n</div>';
            const indentation = '    ';

            const formatted = (codeInserter as any).formatTemplate(template, indentation);

            assert.ok(formatted.includes('    <div>'));
            assert.ok(formatted.includes('        <p>Content</p>'));
            assert.ok(formatted.includes('    </div>'));
        });
    });

    describe('Insertion Point Validation', () => {
        it('Should validate correct insertion point', () => {
            const insertionPoint: InsertionPoint = {
                file: '/path/to/file.cshtml',
                line: 10,
                character: 4,
                indentation: '    '
            };

            const isValid = (codeInserter as any).validateInsertionPoint(insertionPoint);

            assert.strictEqual(isValid, true);
        });

        it('Should reject insertion point with negative line', () => {
            const insertionPoint: InsertionPoint = {
                file: '/path/to/file.cshtml',
                line: -1,
                character: 4,
                indentation: '    '
            };

            const isValid = (codeInserter as any).validateInsertionPoint(insertionPoint);

            assert.strictEqual(isValid, false);
        });
    });

    describe('Indentation Detection', () => {
        it('Should detect 4-space indentation', () => {
            const line = '    <div>Content</div>';

            const indentation = (codeInserter as any).detectIndentation(line);

            assert.strictEqual(indentation, '    ');
        });

        it('Should detect tab indentation', () => {
            const line = '\t<div>Content</div>';

            const indentation = (codeInserter as any).detectIndentation(line);

            assert.strictEqual(indentation, '\t');
        });
    });
});
