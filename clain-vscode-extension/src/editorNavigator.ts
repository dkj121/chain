import * as path from 'path';

export interface SourceLocation {
    file: string;
    line: number;
    character: number;
}

export interface VscodeWindow {
    showTextDocument(uri: any, options?: any): Thenable<any>;
    showErrorMessage(message: string): void;
}

export interface VscodeUri {
    file(filePath: string): any;
}

export interface VscodeRange {
    new (start: any, end: any): any;
}

export interface VscodePosition {
    new (line: number, character: number): any;
}

export class EditorNavigator {
    constructor(
        private window: VscodeWindow,
        private Uri: VscodeUri,
        private Range: VscodeRange,
        private Position: VscodePosition
    ) {}

    /**
     * Parses a data-clain-src attribute in format: file:line:char
     * @param srcAttribute The source location string (e.g., "Views/Home/Index.cshtml:10:5")
     * @returns Parsed SourceLocation object
     * @throws Error if format is invalid
     */
    public parseSourceLocation(srcAttribute: string): SourceLocation {
        if (!srcAttribute || srcAttribute.trim() === '') {
            throw new Error('Invalid source location format: empty string');
        }

        // Find the last two colons for line:char
        const lastColonIndex = srcAttribute.lastIndexOf(':');
        if (lastColonIndex === -1) {
            throw new Error('Invalid source location format: missing line and character numbers');
        }

        const secondLastColonIndex = srcAttribute.lastIndexOf(':', lastColonIndex - 1);
        if (secondLastColonIndex === -1) {
            throw new Error('Invalid source location format: missing character number');
        }

        const file = srcAttribute.substring(0, secondLastColonIndex);
        const lineStr = srcAttribute.substring(secondLastColonIndex + 1, lastColonIndex);
        const charStr = srcAttribute.substring(lastColonIndex + 1);

        const line = parseInt(lineStr, 10);
        const character = parseInt(charStr, 10);

        if (isNaN(line) || isNaN(character)) {
            throw new Error('Invalid line or character number: must be numeric');
        }

        return { file, line, character };
    }

    /**
     * Opens a file in the editor and positions the cursor at the specified location
     * @param location The source location with zero-based line and character indices
     * @param workspaceRoot The workspace root path
     */
    public async navigateToSource(location: SourceLocation, workspaceRoot: string): Promise<void> {
        // Resolve the file path
        const filePath = path.isAbsolute(location.file)
            ? location.file
            : path.join(workspaceRoot, location.file);

        const uri = this.Uri.file(filePath);

        // Location already contains zero-based indices from Tag Helper
        const position = new this.Position(location.line, location.character);
        const range = new this.Range(position, position);

        try {
            await this.window.showTextDocument(uri, {
                selection: range,
                preserveFocus: false
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.window.showErrorMessage(
                `Failed to open file: ${location.file}\n${errorMessage}`
            );
            throw error;
        }
    }

    /**
     * Handles a click event with a data-clain-src attribute
     * @param srcAttribute The data-clain-src attribute value
     * @param workspaceRoot The workspace root path
     */
    public async handleClickEvent(srcAttribute: string, workspaceRoot: string): Promise<void> {
        const location = this.parseSourceLocation(srcAttribute);
        await this.navigateToSource(location, workspaceRoot);
    }
}
