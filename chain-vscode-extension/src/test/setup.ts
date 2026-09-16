import { EventEmitter } from 'events';
import Module from 'module';

/**
 * Mock vscode module for unit tests.
 * This file is loaded before tests run via .mocharc.json
 */

class VSCodeEventEmitter<T> {
    private emitter = new EventEmitter();

    get event() {
        return (listener: (e: T) => any) => {
            this.emitter.on('event', listener);
            return {
                dispose: () => this.emitter.off('event', listener)
            };
        };
    }

    fire(data: T): void {
        this.emitter.emit('event', data);
    }

    dispose(): void {
        this.emitter.removeAllListeners();
    }
}

const vscode = {
    EventEmitter: VSCodeEventEmitter,

    window: {
        showErrorMessage: (message: string) => {
            console.error(message);
            return Promise.resolve(undefined);
        },
        showTextDocument: async (document: any) => {
            return {
                selection: null,
                revealRange: () => {}
            };
        },
        createOutputChannel: (name: string) => ({
            append: () => {},
            clear: () => {},
            show: () => {},
            dispose: () => {}
        })
    },

    workspace: {
        openTextDocument: async (filePath: string) => {
            return { uri: { fsPath: filePath } };
        },
        applyEdit: async () => true,
        createFileSystemWatcher: () => ({
            onDidChange: () => ({ dispose: () => {} }),
            onDidCreate: () => ({ dispose: () => {} }),
            onDidDelete: () => ({ dispose: () => {} }),
            dispose: () => {}
        })
    },

    Position: class {
        line: number;
        character: number;
        constructor(line: number, character: number) {
            this.line = line;
            this.character = character;
        }
    },

    Selection: class {
        anchor: any;
        active: any;
        constructor(anchor: any, active: any) {
            this.anchor = anchor;
            this.active = active;
        }
    },

    Range: class {
        start: any;
        end: any;
        constructor(start: any, end: any) {
            this.start = start;
            this.end = end;
        }
    },

    Uri: {
        file: (path: string) => ({ fsPath: path }),
        parse: (uri: string) => ({ fsPath: uri })
    },

    Disposable: class {
        static from(...disposables: any[]) {
            return {
                dispose: () => disposables.forEach(d => d.dispose?.())
            };
        }
    },

    WorkspaceEdit: class {
        replace() {}
        insert() {}
        delete() {}
    }
};

// Intercept require calls for 'vscode' module
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
    if (id === 'vscode') {
        return vscode;
    }
    return originalRequire.apply(this, arguments);
};