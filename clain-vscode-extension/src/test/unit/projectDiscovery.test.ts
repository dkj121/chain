import * as assert from 'assert';
import * as path from 'path';
import { ProjectDiscovery } from '../../projectDiscovery';

class MockFileSystem {
    public files: Set<string> = new Set();

    async findFiles(pattern: string, exclude?: string): Promise<string[]> {
        // Simple mock: return files that match the pattern
        const results: string[] = [];
        for (const file of this.files) {
            if (pattern.includes('**/*.csproj') && file.endsWith('.csproj')) {
                // Check if file should be excluded
                if (exclude) {
                    const excludePatterns = exclude.split(',').map(p => p.trim());
                    let shouldExclude = false;
                    for (const excl of excludePatterns) {
                        if (excl.includes('node_modules') && file.includes('node_modules')) {
                            shouldExclude = true;
                            break;
                        }
                        if (excl.includes('bin') && file.includes('/bin/')) {
                            shouldExclude = true;
                            break;
                        }
                        if (excl.includes('obj') && file.includes('/obj/')) {
                            shouldExclude = true;
                            break;
                        }
                    }
                    if (shouldExclude) {
                        continue;
                    }
                }
                results.push(file);
            }
        }
        return results;
    }
}

suite('ProjectDiscovery Tests', () => {
    let discovery: ProjectDiscovery;
    let mockFs: MockFileSystem;
    let workspaceRoot: string;

    setup(() => {
        mockFs = new MockFileSystem();
        workspaceRoot = '/workspace';
        discovery = new ProjectDiscovery(workspaceRoot, mockFs as any);
    });

    test('Should find single csproj in root', async () => {
        mockFs.files.add('/workspace/MyApp.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
        assert.strictEqual(projects[0].path, '/workspace/MyApp.csproj');
        assert.strictEqual(projects[0].directory, '/workspace');
    });

    test('Should find multiple csproj files', async () => {
        mockFs.files.add('/workspace/src/Web/Web.csproj');
        mockFs.files.add('/workspace/src/Api/Api.csproj');
        mockFs.files.add('/workspace/tests/Tests.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 3);
        const names = projects.map(p => p.name).sort();
        assert.deepStrictEqual(names, ['Api', 'Tests', 'Web']);
    });

    test('Should exclude files in node_modules', async () => {
        mockFs.files.add('/workspace/MyApp.csproj');
        mockFs.files.add('/workspace/node_modules/pkg/fake.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
    });

    test('Should exclude files in bin directory', async () => {
        mockFs.files.add('/workspace/MyApp.csproj');
        mockFs.files.add('/workspace/bin/Debug/net8.0/fake.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
    });

    test('Should exclude files in obj directory', async () => {
        mockFs.files.add('/workspace/MyApp.csproj');
        mockFs.files.add('/workspace/obj/Debug/fake.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
    });

    test('Should return empty array when no projects found', async () => {
        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 0);
    });

    test('Should extract project name correctly from nested path', async () => {
        mockFs.files.add('/workspace/src/apps/MyComplex.Web.App.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyComplex.Web.App');
        assert.strictEqual(projects[0].directory, '/workspace/src/apps');
    });

    test('Should sort projects alphabetically by name', async () => {
        mockFs.files.add('/workspace/Zebra.csproj');
        mockFs.files.add('/workspace/Apple.csproj');
        mockFs.files.add('/workspace/Middle.csproj');

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 3);
        assert.strictEqual(projects[0].name, 'Apple');
        assert.strictEqual(projects[1].name, 'Middle');
        assert.strictEqual(projects[2].name, 'Zebra');
    });
});
