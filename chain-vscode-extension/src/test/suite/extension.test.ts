import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Running Chain extension tests');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('chain.chain'));
    });

    test('Extension should activate', async () => {
        const ext = vscode.extensions.getExtension('chain.chain');
        await ext?.activate();
        assert.ok(ext?.isActive);
    });

    test('Start Preview command should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('chain.startPreview'));
    });

    test('Stop Preview command should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('chain.stopPreview'));
    });
});
