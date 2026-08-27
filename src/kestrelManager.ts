import * as child_process from 'child_process';
import * as vscode from 'vscode';

export class KestrelManager {
    private process: child_process.ChildProcess | null = null;
    private outputChannel: vscode.OutputChannel;
    private isReady: boolean = false;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Clain - Kestrel');
    }

    public async start(projectPath: string): Promise<void> {
        if (this.process) {
            throw new Error('Kestrel is already running');
        }

        this.isReady = false;
        this.outputChannel.clear();
        this.outputChannel.show();

        return new Promise((resolve, reject) => {
            this.process = child_process.spawn('dotnet', ['watch', 'run'], {
                cwd: projectPath,
                shell: true
            });

            if (!this.process.stdout || !this.process.stderr) {
                reject(new Error('Failed to create Kestrel process streams'));
                return;
            }

            let startupTimeout = setTimeout(() => {
                this.stop();
                reject(new Error('Kestrel startup timed out after 30 seconds'));
            }, 30000);

            this.process.stdout.on('data', (data: Buffer) => {
                const output = data.toString();
                this.outputChannel.append(output);

                if (output.includes('Now listening on:')) {
                    this.isReady = true;
                    clearTimeout(startupTimeout);
                    vscode.window.showInformationMessage('Kestrel server is ready');
                    resolve();
                }
            });

            this.process.stderr.on('data', (data: Buffer) => {
                const error = data.toString();
                this.outputChannel.append(`[ERROR] ${error}`);
            });

            this.process.on('error', (error: Error) => {
                clearTimeout(startupTimeout);
                this.outputChannel.append(`[PROCESS ERROR] ${error.message}`);
                reject(error);
            });

            this.process.on('exit', (code: number | null) => {
                this.outputChannel.append(`\n[EXIT] Kestrel exited with code ${code}`);
                this.process = null;
                this.isReady = false;
            });
        });
    }

    public stop(): void {
        if (this.process) {
            this.outputChannel.append('\n[STOP] Terminating Kestrel process...\n');
            this.process.kill();
            this.process = null;
            this.isReady = false;
        }
    }

    public isRunning(): boolean {
        return this.process !== null;
    }

    public isServerReady(): boolean {
        return this.isReady;
    }

    public dispose(): void {
        this.stop();
        this.outputChannel.dispose();
    }
}
