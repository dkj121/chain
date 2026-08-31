import * as vscode from 'vscode';

export interface ElementSelection {
    filePath: string;
    line: number;
    character: number;
    tagName: string;
    id?: string;
    className?: string;
    attributes?: Record<string, string>;
}

export type SelectionChangeListener = (selection: ElementSelection | null) => void;

/**
 * Manages the currently selected element state across Preview and Code editor.
 * Singleton pattern to ensure consistent state across extension components.
 */
export class SelectionStateManager {
    private static instance: SelectionStateManager;
    private currentSelection: ElementSelection | null = null;
    private listeners: SelectionChangeListener[] = [];

    private constructor() {}

    public static getInstance(): SelectionStateManager {
        if (!SelectionStateManager.instance) {
            SelectionStateManager.instance = new SelectionStateManager();
        }
        return SelectionStateManager.instance;
    }

    /**
     * Update the current selection from a Preview click event.
     */
    public setSelection(selection: ElementSelection | null): void {
        this.currentSelection = selection;
        this.notifyListeners();
    }

    /**
     * Get the current selection.
     */
    public getSelection(): ElementSelection | null {
        return this.currentSelection;
    }

    /**
     * Clear the current selection.
     */
    public clearSelection(): void {
        this.currentSelection = null;
        this.notifyListeners();
    }

    /**
     * Register a listener for selection changes.
     */
    public onSelectionChange(listener: SelectionChangeListener): vscode.Disposable {
        this.listeners.push(listener);

        // Return disposable to unregister
        return {
            dispose: () => {
                const index = this.listeners.indexOf(listener);
                if (index > -1) {
                    this.listeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notify all listeners of selection change.
     */
    private notifyListeners(): void {
        for (const listener of this.listeners) {
            try {
                listener(this.currentSelection);
            } catch (error) {
                console.error('Error in selection change listener:', error);
            }
        }
    }

    /**
     * Reset the singleton instance (for testing).
     */
    public static reset(): void {
        if (SelectionStateManager.instance) {
            SelectionStateManager.instance.listeners = [];
            SelectionStateManager.instance.currentSelection = null;
        }
        SelectionStateManager.instance = null as any;
    }
}
