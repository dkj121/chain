import * as assert from 'assert';
import { ClickHandler, ClickEvent } from '../../clickHandler';

class MockOutputChannel {
    public messages: string[] = [];

    appendLine(message: string): void {
        this.messages.push(message);
    }

    clear(): void {
        this.messages = [];
    }

    dispose(): void {}
}

class MockVscodeWindow {
    async showTextDocument(uri: any, options?: any): Promise<any> {
        return {};
    }

    showErrorMessage(message: string): void {
        // Mock implementation
    }
}

class MockVscodeUri {
    static file(filePath: string): any {
        return { fsPath: filePath };
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

suite('ClickHandler Tests', () => {
    let clickHandler: ClickHandler;
    let mockOutputChannel: MockOutputChannel;
    let mockWindow: MockVscodeWindow;

    setup(() => {
        mockOutputChannel = new MockOutputChannel();
        mockWindow = new MockVscodeWindow();
        clickHandler = new ClickHandler(
            mockOutputChannel as any,
            '/test/workspace',
            mockWindow as any,
            MockVscodeUri as any,
            MockVscodeRange as any,
            MockVscodePosition as any
        );
    });

    test('Should handle click event with element data', () => {
        const clickEvent: ClickEvent = {
            x: 100,
            y: 200,
            tagName: 'button',
            id: 'submit-btn',
            className: 'btn btn-primary',
            textContent: 'Submit',
            timestamp: Date.now()
        };

        clickHandler.handleClick(clickEvent);

        assert.ok(mockOutputChannel.messages.length > 0);
        assert.ok(mockOutputChannel.messages[0].includes('button'));
        assert.ok(mockOutputChannel.messages[0].includes('submit-btn'));
    });

    test('Should handle click event without id', () => {
        const clickEvent: ClickEvent = {
            x: 150,
            y: 250,
            tagName: 'div',
            className: 'container',
            textContent: 'Content',
            timestamp: Date.now()
        };

        clickHandler.handleClick(clickEvent);

        assert.ok(mockOutputChannel.messages.length > 0);
        assert.ok(mockOutputChannel.messages[0].includes('div'));
    });

    test('Should format click information correctly', () => {
        const clickEvent: ClickEvent = {
            x: 100,
            y: 200,
            tagName: 'a',
            id: 'link-1',
            className: 'nav-link',
            textContent: 'Home',
            timestamp: Date.now()
        };

        const formatted = clickHandler.formatClickInfo(clickEvent);

        assert.ok(formatted.includes('a'));
        assert.ok(formatted.includes('link-1'));
        assert.ok(formatted.includes('nav-link'));
        assert.ok(formatted.includes('Home'));
        assert.ok(formatted.includes('100'));
        assert.ok(formatted.includes('200'));
    });

    test('Should handle multiple clicks', () => {
        const click1: ClickEvent = {
            x: 10,
            y: 20,
            tagName: 'button',
            id: 'btn1',
            className: 'btn',
            textContent: 'Click 1',
            timestamp: Date.now()
        };

        const click2: ClickEvent = {
            x: 30,
            y: 40,
            tagName: 'button',
            id: 'btn2',
            className: 'btn',
            textContent: 'Click 2',
            timestamp: Date.now()
        };

        clickHandler.handleClick(click1);
        clickHandler.handleClick(click2);

        assert.strictEqual(mockOutputChannel.messages.length, 2);
    });

    test('Should dispose without errors', () => {
        assert.doesNotThrow(() => {
            clickHandler.dispose();
        });
    });
});
