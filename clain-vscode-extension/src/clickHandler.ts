import { EditorNavigator, VscodeWindow, VscodeUri, VscodeRange, VscodePosition } from './editorNavigator';

export interface ClickEvent {
    x: number;
    y: number;
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    timestamp: number;
    dataClainSrc?: string;
}

export interface OutputChannel {
    appendLine(message: string): void;
}

export class ClickHandler {
    private outputChannel: OutputChannel;
    private navigator: EditorNavigator;
    private workspaceRoot: string;

    constructor(
        outputChannel: OutputChannel,
        workspaceRoot: string,
        window: VscodeWindow,
        Uri: VscodeUri,
        Range: VscodeRange,
        Position: VscodePosition
    ) {
        this.outputChannel = outputChannel;
        this.workspaceRoot = workspaceRoot;
        this.navigator = new EditorNavigator(window, Uri, Range, Position);
    }

    public async handleClick(event: ClickEvent): Promise<void> {
        const info = this.formatClickInfo(event);
        this.outputChannel.appendLine(info);

        // If data-clain-src is present, navigate to source
        if (event.dataClainSrc) {
            try {
                await this.navigator.handleClickEvent(event.dataClainSrc, this.workspaceRoot);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.outputChannel.appendLine(`Failed to navigate to source: ${errorMessage}`);
            }
        }
    }

    public formatClickInfo(event: ClickEvent): string {
        const parts: string[] = [
            `Click detected at (${event.x}, ${event.y})`,
            `Element: <${event.tagName}>`
        ];

        if (event.id) {
            parts.push(`id="${event.id}"`);
        }

        if (event.className) {
            parts.push(`class="${event.className}"`);
        }

        if (event.textContent) {
            const truncated = event.textContent.substring(0, 50);
            parts.push(`text="${truncated}"`);
        }

        return parts.join(' ');
    }

    public dispose(): void {
        // No resources to clean up currently
    }
}
