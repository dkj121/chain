import * as assert from 'assert';
import { EditorNavigator, SourceLocation } from '../../editorNavigator';
import * as path from 'path';

class MockTextDocument {
    public uri: any;
    constructor(uri: any) {
        this.uri = uri;
    }
}

class MockTextEditor {
    public document: MockTextDocument;
    public selection: any;
    constructor(document: MockTextDocument, selection: any) {
        this.document = document;
        this.selection = selection;
    }
}

class MockVscodeWindow {
    public lastUri: any = null;
    public lastOptions: any = null;
    public shouldThrowError = false;
    public errorMessage = '';

    async showTextDocument(uri: any, options?: any): Promise<MockTextEditor> {
        if (this.shouldThrowError) {
            throw new Error(this.errorMessage);
        }
        this.lastUri = uri;
        this.lastOptions = options;
        const doc = new MockTextDocument(uri);
        const selection = options?.selection;
        return new MockTextEditor(doc, selection);
    }

    showErrorMessage(message: string): void {
        // Mock implementation
    }
}

class MockVscodeUri {
    public static file(filePath: string): any {
        return { fsPath: filePath, scheme: 'file' };
    }
}

class MockVscodeRange {
    public start: any;
    public end: any;
    constructor(start: any, end: any) {
        this.start = start;
        this.end = end;
    }
}

class MockVscodePosition {
    public line: number;
    public character: number;
    constructor(line: number, character: number) {
        this.line = line;
        this.character = character;
    }
}

suite('EditorNavigator Tests', () => {
    let navigator: EditorNavigator;
    let mockWindow: MockVscodeWindow;
    let mockUri: typeof MockVscodeUri;
    let mockRange: typeof MockVscodeRange;
    let mockPosition: typeof MockVscodePosition;

    setup(() => {
        mockWindow = new MockVscodeWindow();
        mockUri = MockVscodeUri;
        mockRange = MockVscodeRange;
        mockPosition = MockVscodePosition;
        navigator = new EditorNavigator(
            mockWindow as any,
            mockUri as any,
            mockRange as any,
            mockPosition as any
        );
    });

    suite('parseSourceLocation', () => {
        test('Should parse valid data-clain-src format', () => {
            const result = navigator.parseSourceLocation('Views/Home/Index.cshtml:10:5');

            assert.strictEqual(result.file, 'Views/Home/Index.cshtml');
            assert.strictEqual(result.line, 10);
            assert.strictEqual(result.character, 5);
        });

        test('Should parse with absolute path', () => {
            const result = navigator.parseSourceLocation('/home/user/Views/Home/Index.cshtml:42:12');

            assert.strictEqual(result.file, '/home/user/Views/Home/Index.cshtml');
            assert.strictEqual(result.line, 42);
            assert.strictEqual(result.character, 12);
        });

        test('Should throw on malformed format - missing line', () => {
            assert.throws(
                () => navigator.parseSourceLocation('Views/Home/Index.cshtml'),
                /Invalid source location format/
            );
        });

        test('Should throw on malformed format - invalid line number', () => {
            assert.throws(
                () => navigator.parseSourceLocation('Views/Home/Index.cshtml:abc:5'),
                /Invalid line or character number/
            );
        });

        test('Should throw on malformed format - invalid character number', () => {
            assert.throws(
                () => navigator.parseSourceLocation('Views/Home/Index.cshtml:10:xyz'),
                /Invalid line or character number/
            );
        });

        test('Should throw on empty string', () => {
            assert.throws(
                () => navigator.parseSourceLocation(''),
                /Invalid source location format/
            );
        });

        test('Should handle Windows path with drive letter', () => {
            const result = navigator.parseSourceLocation('C:\\Projects\\Views\\Home\\Index.cshtml:10:5');

            assert.strictEqual(result.file, 'C:\\Projects\\Views\\Home\\Index.cshtml');
            assert.strictEqual(result.line, 10);
            assert.strictEqual(result.character, 5);
        });
    });

    suite('navigateToSource', () => {
        test('Should open file and set cursor position', async () => {
            const location: SourceLocation = {
                file: 'Views/Home/Index.cshtml',
                line: 10,
                character: 5
            };

            await navigator.navigateToSource(location, '/workspace');

            assert.ok(mockWindow.lastUri);
            assert.strictEqual(mockWindow.lastUri.fsPath, path.join('/workspace', 'Views/Home/Index.cshtml'));

            const selection = mockWindow.lastOptions?.selection;
            assert.ok(selection);
            assert.strictEqual(selection.start.line, 10); // Already 0-indexed from Tag Helper
            assert.strictEqual(selection.start.character, 5);
            assert.strictEqual(selection.end.line, 10);
            assert.strictEqual(selection.end.character, 5);
        });

        test('Should handle absolute paths', async () => {
            const location: SourceLocation = {
                file: '/absolute/path/Views/Home/Index.cshtml',
                line: 15,
                character: 8
            };

            await navigator.navigateToSource(location, '/workspace');

            assert.strictEqual(mockWindow.lastUri.fsPath, '/absolute/path/Views/Home/Index.cshtml');
        });

        test('Should use zero-based line numbers directly from Tag Helper', async () => {
            const location: SourceLocation = {
                file: 'test.cshtml',
                line: 1,
                character: 0
            };

            await navigator.navigateToSource(location, '/workspace');

            const selection = mockWindow.lastOptions?.selection;
            assert.strictEqual(selection.start.line, 1); // No conversion - already 0-indexed
        });

        test('Should show error message when file cannot be opened', async () => {
            mockWindow.shouldThrowError = true;
            mockWindow.errorMessage = 'File not found';

            const location: SourceLocation = {
                file: 'nonexistent.cshtml',
                line: 1,
                character: 0
            };

            let errorThrown = false;
            try {
                await navigator.navigateToSource(location, '/workspace');
            } catch (e) {
                errorThrown = true;
            }

            assert.ok(errorThrown);
        });
    });

    suite('handleClickEvent', () => {
        test('Should parse and navigate when data-clain-src is present', async () => {
            const srcAttribute = 'Views/Home/Index.cshtml:10:5';

            await navigator.handleClickEvent(srcAttribute, '/workspace');

            assert.ok(mockWindow.lastUri);
            assert.strictEqual(mockWindow.lastUri.fsPath, path.join('/workspace', 'Views/Home/Index.cshtml'));
        });

        test('Should throw on missing data-clain-src', async () => {
            await assert.rejects(
                async () => navigator.handleClickEvent('', '/workspace'),
                /Invalid source location format/
            );
        });

        test('Should throw on malformed data-clain-src', async () => {
            await assert.rejects(
                async () => navigator.handleClickEvent('invalid-format', '/workspace'),
                /Invalid source location format/
            );
        });
    });
});
