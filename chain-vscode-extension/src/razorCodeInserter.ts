import * as vscode from 'vscode';

export interface InsertionPoint {
    file: string;
    line: number;
    character: number;
    indentation: string;
}

/**
 * RazorCodeInserter handles inserting code snippets into Razor (.cshtml) files
 * at precise locations with proper indentation and formatting.
 */
export class RazorCodeInserter {
    constructor() {}

    /**
     * Insert code at the specified insertion point
     */
    public async insertCode(
        insertionPoint: InsertionPoint,
        template: string
    ): Promise<void> {
        if (!this.validateInsertionPoint(insertionPoint)) {
            throw new Error('Invalid insertion point');
        }

        const formattedTemplate = this.formatTemplate(template, insertionPoint.indentation);
        const insertionText = this.prepareInsertionText(formattedTemplate);

        await this.applyWorkspaceEdit(
            insertionPoint.file,
            new vscode.Position(insertionPoint.line, insertionPoint.character),
            insertionText
        );
    }

    /**
     * Format template with proper indentation
     */
    private formatTemplate(template: string, indentation: string): string {
        const lines = template.split('\n');
        return lines.map(line => {
            if (line.trim().length === 0) {
                return line;
            }
            return indentation + line;
        }).join('\n');
    }

    /**
     * Validate insertion point
     */
    private validateInsertionPoint(insertionPoint: InsertionPoint): boolean {
        if (!insertionPoint.file || insertionPoint.file.trim().length === 0) {
            return false;
        }
        if (insertionPoint.line < 0) {
            return false;
        }
        if (insertionPoint.character < 0) {
            return false;
        }
        return true;
    }

    /**
     * Detect indentation from a line of code
     */
    private detectIndentation(line: string): string {
        const match = line.match(/^(\s+)/);
        return match ? match[1] : '';
    }

    /**
     * Prepare insertion text with trailing newline
     */
    private prepareInsertionText(template: string): string {
        return template + '\n';
    }

    /**
     * Apply workspace edit to insert code
     */
    private async applyWorkspaceEdit(
        file: string,
        position: vscode.Position,
        text: string
    ): Promise<void> {
        const uri = vscode.Uri.file(file);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, position, text);
        await vscode.workspace.applyEdit(edit);
    }
}
