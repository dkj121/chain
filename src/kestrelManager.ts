import * as child_process from 'child_process';

const KESTREL_READY_SIGNAL = 'Now listening on:';
const KESTREL_STARTUP_TIMEOUT_MS = 30000;

export interface OutputChannel {
    append(message: string): void;
    clear(): void;
    show(): void;
    dispose(): void;
}

export interface ProcessSpawner {
    spawn(command: string, args: string[], options: child_process.SpawnOptions): child_process.ChildProcess;
}

export class KestrelManager {
    private process: child_process.ChildProcess | null = null;
    private outputChannel: OutputChannel;
    private isReady: boolean = false;
    private processSpawner: ProcessSpawner;
    private serverUrl: string = '';

    constructor(outputChannel: OutputChannel, processSpawner?: ProcessSpawner) {
        this.outputChannel = outputChannel;
        this.processSpawner = processSpawner || {
            spawn: (cmd, args, opts) => child_process.spawn(cmd, args, opts)
        };
    }

    public async start(workspaceRoot: string, csprojPath: string): Promise<void> {
        if (this.process) {
            throw new Error('Kestrel is already running');
        }

        this.isReady = false;
        this.outputChannel.clear();
        this.outputChannel.show();

        return new Promise((resolve, reject) => {
            this.process = this.processSpawner.spawn('dotnet', ['watch', '--project', csprojPath, 'run'], {
                cwd: workspaceRoot,
                shell: true
            });

            if (!this.process.stdout || !this.process.stderr) {
                reject(new Error('Failed to create Kestrel process streams'));
                return;
            }

            let startupTimeout = setTimeout(() => {
                this.stop();
                reject(new Error(`Kestrel startup timed out after ${KESTREL_STARTUP_TIMEOUT_MS / 1000} seconds`));
            }, KESTREL_STARTUP_TIMEOUT_MS);

            this.process.stdout.on('data', (data: Buffer) => {
                const output = data.toString();
                this.outputChannel.append(output);

                if (output.includes(KESTREL_READY_SIGNAL)) {
                    this.isReady = true;
                    this.extractServerUrl(output);
                    clearTimeout(startupTimeout);
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

    public getServerUrl(): string {
        return this.serverUrl;
    }

    public dispose(): void {
        this.stop();
        this.outputChannel.dispose();
    }

    private extractServerUrl(output: string): void {
        // Extract URL from "Now listening on: http://localhost:5000" format
        const match = output.match(/Now listening on:\s+(https?:\/\/[^\s]+)/);
        if (match && match[1]) {
            this.serverUrl = match[1];
        }
    }
}
