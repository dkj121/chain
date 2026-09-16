import { spawn, ChildProcess } from 'child_process';

export interface IChildProcess {
    spawn(command: string, args: string[], options: any): ChildProcess;
}

export class NuGetManager {
    private childProcess: IChildProcess;

    constructor(childProcess: IChildProcess = require('child_process')) {
        this.childProcess = childProcess;
    }

    public async addPackage(projectPath: string, packageName: string, version?: string): Promise<void> {
        const args = ['add', 'package', packageName];

        if (version) {
            args.push('--version', version);
        }

        return this.executeCommand(projectPath, args, `Failed to add NuGet package: ${packageName}`);
    }

    public async restore(projectPath: string): Promise<void> {
        return this.executeCommand(projectPath, ['restore'], 'Failed to restore NuGet packages');
    }

    private executeCommand(cwd: string, args: string[], errorMessage: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const process = this.childProcess.spawn('dotnet', args, { cwd });

            let stdout = '';
            let stderr = '';

            if (!process.stdout || !process.stderr) {
                reject(new Error(`${errorMessage}: Failed to create child process streams`));
                return;
            }

            process.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            process.on('error', (err: Error) => {
                reject(new Error(`${errorMessage}: ${err.message}`));
            });

            process.on('close', (code: number) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`${errorMessage}: ${stderr || stdout}`));
                }
            });
        });
    }
}
