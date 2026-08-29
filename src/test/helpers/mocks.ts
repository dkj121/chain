import { EventEmitter } from 'events';
import { OutputChannel } from '../../kestrelManager';

export class MockOutputChannel implements OutputChannel {
    public messages: string[] = [];
    public isShown: boolean = false;
    public isCleared: boolean = false;
    public isDisposed: boolean = false;

    append(message: string): void {
        this.messages.push(message);
    }

    clear(): void {
        this.isCleared = true;
        this.messages = [];
    }

    show(): void {
        this.isShown = true;
    }

    dispose(): void {
        this.isDisposed = true;
    }
}

export class MockChildProcess extends EventEmitter {
    public stdout = new EventEmitter();
    public stderr = new EventEmitter();
    public killed = false;

    kill(): boolean {
        this.killed = true;
        this.emit('exit', 0);
        return true;
    }
}
