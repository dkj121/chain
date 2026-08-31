import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export interface RazorNode {
    kind: string;
    filePath: string;
    line: number;
    character: number;
    content?: string;
}

export interface AncestryResult {
    position: { line: number; character: number };
    ancestors: RazorNode[];
}

/**
 * Parses Razor (.cshtml) files into AST and provides ancestry traversal.
 * Caches parsed results and invalidates on file changes.
 */
export class RazorAstParser implements vscode.Disposable {
    private astCache: Map<string, any> = new Map();
    private fileWatcher: vscode.FileSystemWatcher;

    constructor() {
        // Watch for .cshtml changes to invalidate cache
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.cshtml');
        this.fileWatcher.onDidChange((uri) => this.invalidateCache(uri));
        this.fileWatcher.onDidDelete((uri) => this.invalidateCache(uri));
    }

    /**
     * Get ancestry chain for a given position in a .cshtml file.
     * Returns array of parent nodes from root to the target position.
     */
    public async getAncestry(
        filePath: string,
        line: number,
        character: number
    ): Promise<AncestryResult | null> {
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(filePath);
            let ast = this.astCache.get(cacheKey);

            if (!ast) {
                // Parse and cache
                ast = await this.parseFile(filePath);
                if (!ast) {
                    return null;
                }
                this.astCache.set(cacheKey, ast);
            }

            // Traverse AST to find ancestors at position
            const ancestors = this.findAncestorsAtPosition(ast, line, character);

            return {
                position: { line, character },
                ancestors
            };
        } catch (error) {
            console.error('Error getting ancestry:', error);
            return null;
        }
    }

    /**
     * Parse a .cshtml file into AST using Roslyn Razor API.
     */
    private async parseFile(filePath: string): Promise<any> {
        // This will call a .NET tool that uses Roslyn Razor API
        // For now, return a mock structure until the .NET tool is built
        return {
            kind: 'Document',
            filePath: filePath,
            children: []
        };
    }

    /**
     * Find all ancestor nodes at a given position.
     */
    private findAncestorsAtPosition(
        ast: any,
        line: number,
        character: number
    ): RazorNode[] {
        const ancestors: RazorNode[] = [];

        // Recursive traversal to find the node at position
        const traverse = (node: any, path: RazorNode[]): boolean => {
            // Check if position is within this node's span
            if (this.containsPosition(node, line, character)) {
                // Add this node to the path
                const razorNode: RazorNode = {
                    kind: node.kind,
                    filePath: node.filePath || ast.filePath,
                    line: node.line || 0,
                    character: node.character || 0,
                    content: node.content
                };

                const newPath = [...path, razorNode];

                // Check children
                if (node.children && node.children.length > 0) {
                    for (const child of node.children) {
                        if (traverse(child, newPath)) {
                            return true;
                        }
                    }
                }

                // This is the deepest node containing the position
                ancestors.push(...newPath);
                return true;
            }

            return false;
        };

        traverse(ast, []);
        return ancestors;
    }

    /**
     * Check if a node contains the given position.
     */
    private containsPosition(node: any, line: number, character: number): boolean {
        if (!node.span) {
            return false;
        }

        const { startLine, startCharacter, endLine, endCharacter } = node.span;

        // Position is after start
        const afterStart =
            line > startLine || (line === startLine && character >= startCharacter);

        // Position is before end
        const beforeEnd =
            line < endLine || (line === endLine && character <= endCharacter);

        return afterStart && beforeEnd;
    }

    /**
     * Invalidate cached AST for a file.
     */
    private invalidateCache(uri: vscode.Uri): void {
        const cacheKey = this.getCacheKey(uri.fsPath);
        this.astCache.delete(cacheKey);
    }

    /**
     * Get cache key for a file path.
     */
    private getCacheKey(filePath: string): string {
        return path.normalize(filePath).toLowerCase();
    }

    /**
     * Clear all cached ASTs.
     */
    public clearCache(): void {
        this.astCache.clear();
    }

    public dispose(): void {
        this.fileWatcher.dispose();
        this.astCache.clear();
    }
}
