import * as assert from 'assert';
import * as path from 'path';
import { ProjectDiscovery } from '../../projectDiscovery';

suite('ProjectDiscovery Tests', () => {
    let discovery: ProjectDiscovery;
    let workspaceRoot: string;
    let mockFiles: string[];

    setup(() => {
        workspaceRoot = '/workspace';
        mockFiles = [];
        const findFiles = async (pattern: string, exclude: string): Promise<string[]> => {
            return mockFiles;
        };
        discovery = new ProjectDiscovery(workspaceRoot, findFiles);
    });

    test('Should find single csproj in root', async () => {
        mockFiles = ['/workspace/MyApp.csproj'];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
        assert.strictEqual(projects[0].path, '/workspace/MyApp.csproj');
        assert.strictEqual(projects[0].directory, '/workspace');
    });

    test('Should find multiple csproj files', async () => {
        mockFiles = [
            '/workspace/src/Web/Web.csproj',
            '/workspace/src/Api/Api.csproj',
            '/workspace/tests/Tests.csproj'
        ];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 3);
        const names = projects.map(p => p.name).sort();
        assert.deepStrictEqual(names, ['Api', 'Tests', 'Web']);
    });

    test('Should exclude files in node_modules', async () => {
        mockFiles = ['/workspace/MyApp.csproj'];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
    });

    test('Should exclude files in bin directory', async () => {
        mockFiles = ['/workspace/MyApp.csproj'];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
    });

    test('Should exclude files in obj directory', async () => {
        mockFiles = ['/workspace/MyApp.csproj'];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyApp');
    });

    test('Should return empty array when no projects found', async () => {
        mockFiles = [];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 0);
    });

    test('Should extract project name correctly from nested path', async () => {
        mockFiles = ['/workspace/src/apps/MyComplex.Web.App.csproj'];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 1);
        assert.strictEqual(projects[0].name, 'MyComplex.Web.App');
        assert.strictEqual(projects[0].directory, '/workspace/src/apps');
    });

    test('Should sort projects alphabetically by name', async () => {
        mockFiles = [
            '/workspace/Zebra.csproj',
            '/workspace/Apple.csproj',
            '/workspace/Middle.csproj'
        ];

        const projects = await discovery.findProjects();

        assert.strictEqual(projects.length, 3);
        assert.strictEqual(projects[0].name, 'Apple');
        assert.strictEqual(projects[1].name, 'Middle');
        assert.strictEqual(projects[2].name, 'Zebra');
    });
});
