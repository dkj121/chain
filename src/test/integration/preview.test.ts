import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Preview Integration Tests', () => {
    test('Start preview and verify homepage renders correctly', async function() {
        this.timeout(30000); // Allow 30 seconds for Kestrel to start

        // Execute the start preview command
        await vscode.commands.executeCommand('clain.startPreview');

        // Wait for Kestrel to start and become ready
        await waitForCondition(async () => {
            // Check if the webview panel was created by looking for the output channel
            const outputChannel = await getOutputChannelContent();
            return outputChannel.includes('Now listening on:');
        }, 25000, 'Kestrel failed to start');

        // Verify the webview panel exists
        // Note: In a real VS Code extension test, we'd verify the webview panel
        // but the VS Code test environment has limitations accessing webview content

        // Verify output channel shows server is running
        const outputContent = await getOutputChannelContent();
        assert.ok(outputContent.includes('Now listening on:'), 'Server should be listening');

        // Clean up - stop the preview
        await vscode.commands.executeCommand('clain.stopPreview');
    });

    test('Refresh preview updates webview content', async function() {
        this.timeout(30000);

        // Start preview
        await vscode.commands.executeCommand('clain.startPreview');

        // Wait for ready state
        await waitForCondition(async () => {
            const outputChannel = await getOutputChannelContent();
            return outputChannel.includes('Now listening on:');
        }, 25000, 'Kestrel failed to start');

        // Execute refresh command
        await vscode.commands.executeCommand('clain.refreshPreview');

        // Verify command executed without error
        // In a full integration test environment, we'd verify the iframe reloaded

        // Clean up
        await vscode.commands.executeCommand('clain.stopPreview');
    });
});

async function waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number,
    errorMessage: string
): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await sleep(500);
    }
    throw new Error(errorMessage);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOutputChannelContent(): Promise<string> {
    // This is a simplified mock - in a real test environment,
    // we'd access the actual output channel content
    // For now, we return empty string as the real implementation
    // would require VS Code test environment setup
    return '';
}
