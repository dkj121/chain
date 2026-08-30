import * as assert from 'assert';
import { KestrelManager, ProcessSpawner } from '../../kestrelManager';
import * as child_process from 'child_process';
import { MockOutputChannel, MockChildProcess } from '../helpers/mocks';

suite('KestrelManager Behavioral Tests', () => {
    let outputChannel: MockOutputChannel;
    let mockProcess: MockChildProcess;
    let mockSpawner: ProcessSpawner;
    let kestrelManager: KestrelManager;

    setup(() => {
        outputChannel = new MockOutputChannel();
        mockProcess = new MockChildProcess();

        mockSpawner = {
            spawn: (command: string, args: string[], options: child_process.SpawnOptions) => {
                return mockProcess as any;
            }
        };

        kestrelManager = new KestrelManager(outputChannel, mockSpawner);
    });

    teardown(() => {
        kestrelManager.dispose();
    });

    test('Detects ready state when "Now listening on:" appears in stdout', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        // Simulate Kestrel startup output
        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Building...'));
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.strictEqual(kestrelManager.isServerReady(), true);
        assert.strictEqual(kestrelManager.isRunning(), true);
    });

    test('Throws error when starting with already running process', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        // Attempt to start again
        await assert.rejects(
            async () => await kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj'),
            { message: 'Kestrel is already running' }
        );
    });

    test('Appends stdout output to output channel', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Building project...'));
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.ok(outputChannel.messages.some(msg => msg.includes('Building project...')));
        assert.ok(outputChannel.messages.some(msg => msg.includes('Now listening on:')));
    });

    test('Appends stderr output with [ERROR] prefix', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stderr.emit('data', Buffer.from('Warning: deprecated API'));
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.ok(outputChannel.messages.some(msg => msg.includes('[ERROR] Warning: deprecated API')));
    });

    test('Rejects when process emits error event', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.emit('error', new Error('Command not found'));
        }, 10);

        await assert.rejects(
            async () => await startPromise,
            { message: 'Command not found' }
        );
    });

    test('Stop terminates process and updates state', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.strictEqual(kestrelManager.isRunning(), true);

        kestrelManager.stop();

        assert.strictEqual(mockProcess.killed, true);
        assert.strictEqual(kestrelManager.isRunning(), false);
        assert.strictEqual(kestrelManager.isServerReady(), false);
    });

    test('Stop is safe when process not running', () => {
        assert.doesNotThrow(() => {
            kestrelManager.stop();
        });

        assert.strictEqual(kestrelManager.isRunning(), false);
    });

    test('Process exit event updates state', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.strictEqual(kestrelManager.isRunning(), true);

        // Simulate process crash
        mockProcess.emit('exit', 1);

        assert.strictEqual(kestrelManager.isRunning(), false);
        assert.strictEqual(kestrelManager.isServerReady(), false);
    });

    test('Clears and shows output channel on start', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.strictEqual(outputChannel.isCleared, true);
        assert.strictEqual(outputChannel.isShown, true);
    });

    test('Dispose stops process and disposes output channel', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        kestrelManager.dispose();

        assert.strictEqual(mockProcess.killed, true);
        assert.strictEqual(outputChannel.isDisposed, true);
    });

    test('Extracts server URL from Kestrel output', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: http://localhost:5000'));
        }, 10);

        await startPromise;

        assert.strictEqual(kestrelManager.getServerUrl(), 'http://localhost:5000');
    });

    test('Extracts HTTPS server URL from Kestrel output', async () => {
        const startPromise = kestrelManager.start('/test/workspace', '/test/workspace/MyApp.csproj');

        setTimeout(() => {
            mockProcess.stdout.emit('data', Buffer.from('Now listening on: https://localhost:5001'));
        }, 10);

        await startPromise;

        assert.strictEqual(kestrelManager.getServerUrl(), 'https://localhost:5001');
    });

    test('Returns empty string if URL not extracted', () => {
        assert.strictEqual(kestrelManager.getServerUrl(), '');
    });
});
