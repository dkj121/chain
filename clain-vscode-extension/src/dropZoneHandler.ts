import { RazorCodeInserter, InsertionPoint } from './razorCodeInserter';
import { DropInfo, Component } from './toolboxPanel';

/**
 * DropZoneHandler coordinates drag-and-drop operations from the toolbox
 * into the preview panel, translating drop events into code insertions.
 */
export class DropZoneHandler {
    constructor(private codeInserter: RazorCodeInserter) {}

    /**
     * Handle a drop event from the preview webview
     */
    public async handleDrop(
        dropInfo: DropInfo,
        component: Component
    ): Promise<void> {
        // Parse the data-clain-src attribute to get file location
        const insertionPoint = this.parseTargetLocation(
            dropInfo.targetFile,
            dropInfo.targetLine,
            dropInfo.targetChar,
            dropInfo.position
        );

        // Insert the component template at the target location
        await this.codeInserter.insertCode(insertionPoint, component.template);
    }

    /**
     * Parse target location from data-clain-src attribute
     * Format: "file.cshtml:line:char"
     */
    private parseTargetLocation(
        targetFile: string,
        targetLine: number,
        targetChar: number,
        position: 'before' | 'after' | 'inside'
    ): InsertionPoint {
        // Adjust line/character based on position
        let adjustedLine = targetLine;
        let adjustedChar = targetChar;

        if (position === 'after') {
            adjustedLine += 1;
            adjustedChar = 0;
        } else if (position === 'inside') {
            // Insert as first child (next line, indented)
            adjustedLine += 1;
            adjustedChar = 0;
        }

        return {
            file: targetFile,
            line: adjustedLine,
            character: adjustedChar,
            indentation: this.detectIndentationLevel(targetChar)
        };
    }

    /**
     * Convert character position to indentation string
     */
    private detectIndentationLevel(characterPosition: number): string {
        // Assume 4-space indentation (could be made configurable)
        const spaces = Math.max(0, characterPosition);
        return ' '.repeat(spaces);
    }

    /**
     * Determine if drop target is valid for the component type
     */
    public isValidDropTarget(
        componentCategory: string,
        targetContext: DropInfo['context']
    ): boolean {
        // Razor components can only be dropped in Razor contexts
        if (componentCategory === 'razor') {
            // Check if we're inside a Razor block (@foreach, @if, etc.)
            const razorBlock = targetContext.razorBlock;
            if (!razorBlock) {
                return false;
            }
        }

        // HTML and Bootstrap components can be dropped anywhere
        return true;
    }
}
