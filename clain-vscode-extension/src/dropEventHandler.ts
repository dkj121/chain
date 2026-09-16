import { DropZoneHandler } from './dropZoneHandler';
import { DropInfo, Component } from './toolboxPanel';

/**
 * DropEventHandler processes drop messages from the webview and coordinates
 * with DropZoneHandler to insert code.
 */
export class DropEventHandler {
    private componentMap: Map<string, Component>;

    constructor(
        private dropZoneHandler: DropZoneHandler,
        allowedComponents: Component[]
    ) {
        this.componentMap = new Map();
        allowedComponents.forEach(c => this.componentMap.set(c.id, c));
    }

    /**
     * Handle incoming messages from webview
     */
    public async handleMessage(message: any): Promise<void> {
        // Validate message structure
        if (!message || !message.command) {
            throw new Error('Invalid message: missing command');
        }

        if (message.command === 'drop') {
            await this.handleDropMessage(message);
        }
    }

    /**
     * Handle drop message from webview
     */
    private async handleDropMessage(message: any): Promise<void> {
        // Validate required fields
        if (!message.componentId) {
            throw new Error('Invalid message: missing componentId');
        }
        if (!message.targetSrc) {
            throw new Error('Invalid message: missing targetSrc');
        }

        // Find component
        const component = this.findComponent(message.componentId);
        if (!component) {
            throw new Error(`Unknown component: ${message.componentId}`);
        }

        // Parse target location
        const target = this.parseDataClainSrc(message.targetSrc);

        // Extract context
        const context = this.extractContext(message);

        // Build DropInfo
        const dropInfo: DropInfo = {
            componentId: message.componentId,
            targetFile: target.file,
            targetLine: target.line,
            targetChar: target.character,
            position: message.position || 'before',
            context: context
        };

        // Delegate to DropZoneHandler
        await this.dropZoneHandler.handleDrop(dropInfo, component);
    }

    /**
     * Parse data-clain-src attribute format: "file.cshtml:line:char"
     */
    private parseDataClainSrc(targetSrc: string): { file: string; line: number; character: number } {
        const parts = targetSrc.split(':');

        if (parts.length < 3) {
            throw new Error('Invalid data-clain-src format. Expected: "file:line:char"');
        }

        // File path may contain colons (e.g., Windows C:\...), so join all but last 2 parts
        const file = parts.slice(0, -2).join(':');
        const line = parseInt(parts[parts.length - 2], 10);
        const character = parseInt(parts[parts.length - 1], 10);

        if (isNaN(line) || isNaN(character)) {
            throw new Error('Invalid data-clain-src format: line and character must be numbers');
        }

        return { file, line, character };
    }

    /**
     * Find component by ID
     */
    private findComponent(componentId: string): Component | null {
        return this.componentMap.get(componentId) || null;
    }

    /**
     * Extract context from message
     */
    private extractContext(message: any): DropInfo['context'] {
        return {
            parentElement: message.context?.parentElement || '',
            siblingElements: message.context?.siblingElements || [],
            razorBlock: message.context?.razorBlock
        };
    }
}
