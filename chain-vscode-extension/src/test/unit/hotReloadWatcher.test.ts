import * as assert from 'assert';
import * as sinon from 'sinon';
import { HotReloadWatcher } from '../../hotReloadWatcher';

suite('HotReloadWatcher Tests', () => {
    let watcher: HotReloadWatcher;
    let mockWebviewManager: any;
    let clock: sinon.SinonFakeTimers;
    let mockFileWatcher: any;
    let changeListeners: Array<(uri: any) => void> = [];
    let createListeners: Array<(uri: any) => void> = [];
    let deleteListeners: Array<(uri: any) => void> = [];

    setup(() => {
        clock = sinon.useFakeTimers();
        changeListeners = [];
        createListeners = [];
        deleteListeners = [];

        mockWebviewManager = {
            refresh: sinon.stub(),
            showLoadingIndicator: sinon.stub(),
            hideLoadingIndicator: sinon.stub()
        };

        mockFileWatcher = {
            onDidChange: (callback: (uri: any) => void) => {
                changeListeners.push(callback);
                return { dispose: () => {} };
            },
            onDidCreate: (callback: (uri: any) => void) => {
                createListeners.push(callback);
                return { dispose: () => {} };
            },
            onDidDelete: (callback: (uri: any) => void) => {
                deleteListeners.push(callback);
                return { dispose: () => {} };
            },
            dispose: sinon.stub()
        };

        watcher = new HotReloadWatcher(mockWebviewManager, () => mockFileWatcher);
    });

    teardown(() => {
        watcher.dispose();
        clock.restore();
    });

    test('Should create file watcher for cshtml files', () => {
        assert.ok(watcher);
        assert.strictEqual(changeListeners.length, 1);
        assert.strictEqual(createListeners.length, 1);
        assert.strictEqual(deleteListeners.length, 1);
    });

    test('Should debounce rapid file changes', () => {
        // Trigger 5 rapid changes
        for (let i = 0; i < 5; i++) {
            changeListeners[0]({ fsPath: '/test/file.cshtml' });
        }

        // Should not trigger refresh immediately
        assert.strictEqual(mockWebviewManager.refresh.callCount, 0);

        // Advance by debounce period (300ms)
        clock.tick(300);

        // Should trigger refresh only once
        assert.strictEqual(mockWebviewManager.refresh.callCount, 1);
    });

    test('Should show loading indicator on file change', () => {
        changeListeners[0]({ fsPath: '/test/file.cshtml' });

        assert.strictEqual(mockWebviewManager.showLoadingIndicator.callCount, 1);
    });

    test('Should hide loading indicator after refresh completes', () => {
        changeListeners[0]({ fsPath: '/test/file.cshtml' });
        clock.tick(300);

        assert.strictEqual(mockWebviewManager.hideLoadingIndicator.callCount, 1);
    });

    test('Should handle multiple files changed in quick succession', () => {
        changeListeners[0]({ fsPath: '/test/file1.cshtml' });
        clock.tick(100);
        changeListeners[0]({ fsPath: '/test/file2.cshtml' });
        clock.tick(100);
        changeListeners[0]({ fsPath: '/test/file3.cshtml' });
        clock.tick(300);

        // Should only refresh once after all changes
        assert.strictEqual(mockWebviewManager.refresh.callCount, 1);
    });

    test('Should handle file creation events', () => {
        createListeners[0]({ fsPath: '/test/new.cshtml' });
        clock.tick(300);

        assert.strictEqual(mockWebviewManager.refresh.callCount, 1);
    });

    test('Should handle file deletion events', () => {
        deleteListeners[0]({ fsPath: '/test/deleted.cshtml' });
        clock.tick(300);

        assert.strictEqual(mockWebviewManager.refresh.callCount, 1);
    });

    test('Should cleanup resources on dispose', () => {
        const disposeSpy = sinon.spy(watcher, 'dispose');
        watcher.dispose();

        assert.strictEqual(disposeSpy.callCount, 1);
        assert.strictEqual(mockFileWatcher.dispose.callCount, 1);
    });

    test('Should not refresh if disposed', () => {
        watcher.dispose();
        changeListeners[0]({ fsPath: '/test/file.cshtml' });
        clock.tick(300);

        assert.strictEqual(mockWebviewManager.refresh.callCount, 0);
    });
});
