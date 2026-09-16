import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { RazorCodeInserter, InsertionPoint } from './razorCodeInserter';
import { DropInfo, Component } from './toolboxPanel';

/**
 * DropZoneHandler coordinates drag-and-drop operations from the toolbox
 * into the preview panel, translating drop events into code insertions.
 */
export class DropZoneHandler {
    private allowedComponents: Map<string, Component> = new Map();

    constructor(
        private codeInserter: RazorCodeInserter,
        allowedComponents: Component[]
    ) {
        allowedComponents.forEach(c => this.allowedComponents.set(c.id, c));
    }

    /**
     * Handle a drop event from the preview webview
     */
    public async handleDrop(
        dropInfo: DropInfo,
        component: Component
    ): Promise<void> {
        // Validate component against allowlist
        const allowedComponent = this.allowedComponents.get(component.id);
        if (!allowedComponent) {
            throw new Error(`Unknown component ID: ${component.id}`);
        }

        // Verify all fields match (prevent field tampering)
        if (allowedComponent.category !== component.category ||
            allowedComponent.template !== component.template ||
            allowedComponent.name !== component.name) {
            throw new Error(`Component data mismatch for ID: ${component.id}`);
        }

        // Validate drop target is appropriate for component type
        if (!this.isValidDropTarget(allowedComponent.category, dropInfo.context)) {
            throw new Error(
                `Cannot drop ${allowedComponent.category} component in this context. ` +
                `Razor components require a Razor block context (@foreach, @if, etc.)`
            );
        }

        // Validate targetFile is within workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const targetUri = vscode.Uri.file(dropInfo.targetFile);
        const targetPath = targetUri.fsPath;

        // Resolve symlinks to prevent directory traversal attacks
        let realTargetPath: string;
        try {
            realTargetPath = fs.realpathSync(targetPath);
        } catch (error) {
            throw new Error(`Cannot resolve target file path: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Check if resolved target is within workspace
        const isInWorkspace = workspaceFolders.some(folder => {
            let realFolderPath: string;
            try {
                realFolderPath = fs.realpathSync(folder.uri.fsPath);
            } catch (error) {
                return false;
            }
            return realTargetPath.startsWith(realFolderPath + path.sep) || realTargetPath === realFolderPath;
        });

        if (!isInWorkspace) {
            throw new Error('Target file must be within workspace');
        }

        // Also validate file extension
        if (!targetPath.endsWith('.cshtml') && !targetPath.endsWith('.razor')) {
            throw new Error('Target file must be a Razor file (.cshtml or .razor)');
        }

        // Parse the data-chain-src attribute to get file location
        const insertionPoint = this.parseTargetLocation(
            dropInfo.targetFile,
            dropInfo.targetLine,
            dropInfo.targetChar,
            dropInfo.position
        );

        // Use the validated component from allowlist, not the input
        await this.codeInserter.insertCode(insertionPoint, allowedComponent.template);
    }

    /**
     * Parse target location from data-chain-src attribute
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
        const MAX_INDENTATION = 200; // 50 levels * 4 spaces is generous
        const spaces = Math.max(0, Math.min(characterPosition, MAX_INDENTATION));
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
