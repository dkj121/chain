import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('HtmxTagHelpers Integration Tests', () => {
    test('Install HtmxTagHelpers package and verify _ViewImports.cshtml', async function() {
        this.timeout(60000); // Allow 60 seconds for package installation

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.skip();
            return;
        }

        const projectPath = workspaceFolders[0].uri.fsPath;
        const csprojFiles = fs.readdirSync(projectPath).filter(f => f.endsWith('.csproj'));

        if (csprojFiles.length === 0) {
            this.skip();
            return;
        }

        // Execute the install command
        await vscode.commands.executeCommand('clain.installHtmxTagHelpers');

        // Wait a bit for installation to complete
        await sleep(5000);

        // Verify the package was added to .csproj file
        const csprojPath = path.join(projectPath, csprojFiles[0]);
        const csprojContent = fs.readFileSync(csprojPath, 'utf-8');
        assert.ok(
            csprojContent.includes('HtmxTagHelpers'),
            'HtmxTagHelpers package should be in .csproj file'
        );

        // Verify _ViewImports.cshtml exists and contains the tag helper reference
        const viewImportsPath = path.join(projectPath, 'Views', '_ViewImports.cshtml');
        if (fs.existsSync(viewImportsPath)) {
            const viewImportsContent = fs.readFileSync(viewImportsPath, 'utf-8');
            assert.ok(
                viewImportsContent.includes('@addTagHelper *, HtmxTagHelpers') ||
                viewImportsContent.includes('HtmxTagHelpers'),
                '_ViewImports.cshtml should reference HtmxTagHelpers'
            );
        }
    });

    test('Verify NuGet restore after package installation', async function() {
        this.timeout(60000);

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            this.skip();
            return;
        }

        const projectPath = workspaceFolders[0].uri.fsPath;
        const objPath = path.join(projectPath, 'obj');

        // After installation, obj folder should exist (created by restore)
        if (fs.existsSync(objPath)) {
            const projectAssetsPath = path.join(objPath, 'project.assets.json');
            assert.ok(
                fs.existsSync(projectAssetsPath),
                'project.assets.json should exist after restore'
            );
        }
    });
});

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
