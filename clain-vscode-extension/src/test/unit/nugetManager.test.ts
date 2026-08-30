import * as assert from 'assert';
import { NuGetManager } from '../../nugetManager';

class MockChildProcess {
    public command: string = '';
    public args: string[] = [];
    public cwd: string = '';
    public exitCode: number = 0;
    public stdout: string = '';
    public stderr: string = '';

    spawn(command: string, args: string[], options: any): any {
        this.command = command;
        this.args = args;
        this.cwd = options.cwd;

        const mockProcess = {
            stdout: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    if (event === 'data' && this.stdout) {
                        callback(Buffer.from(this.stdout));
                    }
                }
            },
            stderr: {
                on: (event: string, callback: (data: Buffer) => void) => {
                    if (event === 'data' && this.stderr) {
                        callback(Buffer.from(this.stderr));
                    }
                }
            },
            on: (event: string, callback: (code: number) => void) => {
                if (event === 'close') {
                    setTimeout(() => callback(this.exitCode), 0);
                }
            }
        };

        return mockProcess;
    }
}

suite('NuGetManager Tests', () => {
    let nugetManager: NuGetManager;
    let mockProcess: MockChildProcess;

    setup(() => {
        mockProcess = new MockChildProcess();
        nugetManager = new NuGetManager(mockProcess as any);
    });

    test('Should add NuGet package successfully', async () => {
        mockProcess.exitCode = 0;
        mockProcess.stdout = 'Successfully added package';

        await nugetManager.addPackage('/test/project', 'HtmxTagHelpers');

        assert.strictEqual(mockProcess.command, 'dotnet');
        assert.deepStrictEqual(mockProcess.args, ['add', 'package', 'HtmxTagHelpers']);
        assert.strictEqual(mockProcess.cwd, '/test/project');
    });

    test('Should add NuGet package with version', async () => {
        mockProcess.exitCode = 0;
        mockProcess.stdout = 'Successfully added package';

        await nugetManager.addPackage('/test/project', 'HtmxTagHelpers', '1.0.0');

        assert.strictEqual(mockProcess.command, 'dotnet');
        assert.deepStrictEqual(mockProcess.args, ['add', 'package', 'HtmxTagHelpers', '--version', '1.0.0']);
    });

    test('Should reject when dotnet add package fails', async () => {
        mockProcess.exitCode = 1;
        mockProcess.stderr = 'Package not found';

        await assert.rejects(
            async () => await nugetManager.addPackage('/test/project', 'InvalidPackage'),
            /Failed to add NuGet package/
        );
    });

    test('Should restore NuGet packages successfully', async () => {
        mockProcess.exitCode = 0;
        mockProcess.stdout = 'Restore succeeded';

        await nugetManager.restore('/test/project');

        assert.strictEqual(mockProcess.command, 'dotnet');
        assert.deepStrictEqual(mockProcess.args, ['restore']);
        assert.strictEqual(mockProcess.cwd, '/test/project');
    });

    test('Should reject when dotnet restore fails', async () => {
        mockProcess.exitCode = 1;
        mockProcess.stderr = 'Restore failed';

        await assert.rejects(
            async () => await nugetManager.restore('/test/project'),
            /Failed to restore NuGet packages/
        );
    });
});
