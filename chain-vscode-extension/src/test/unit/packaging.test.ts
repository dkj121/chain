import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

suite('Extension Packaging Tests', () => {
    const rootDir = path.join(__dirname, '../../..');
    const packageJsonPath = path.join(rootDir, 'package.json');
    const readmePath = path.join(rootDir, 'README.md');
    const iconPath = path.join(rootDir, 'icon.png');

    test('package.json should have required marketplace metadata', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        // Required fields for marketplace
        assert.ok(packageJson.name, 'name is required');
        assert.ok(packageJson.displayName, 'displayName is required');
        assert.ok(packageJson.description, 'description is required');
        assert.ok(packageJson.version, 'version is required');
        assert.ok(packageJson.publisher, 'publisher is required');
        assert.ok(packageJson.engines?.vscode, 'vscode engine is required');

        // Verify metadata quality
        assert.ok(packageJson.description.length >= 10, 'description should be descriptive');
        assert.ok(packageJson.description.length <= 200, 'description should not be too long');
    });

    test('package.json should have proper categories', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(Array.isArray(packageJson.categories), 'categories should be an array');
        assert.ok(packageJson.categories.length > 0, 'should have at least one category');

        // Chain should be in appropriate categories
        const validCategories = [
            'Programming Languages',
            'Snippets',
            'Linters',
            'Formatters',
            'Debuggers',
            'Testing',
            'Extension Packs',
            'Language Packs',
            'Data Science',
            'Machine Learning',
            'Visualization',
            'Notebooks',
            'Education',
            'Other'
        ];

        packageJson.categories.forEach((cat: string) => {
            assert.ok(validCategories.includes(cat), `${cat} is not a valid VS Code category`);
        });
    });

    test('package.json should have keywords for discoverability', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(Array.isArray(packageJson.keywords), 'keywords should be an array');
        assert.ok(packageJson.keywords.length >= 3, 'should have at least 3 keywords');

        // Chain-specific keywords should exist
        const keywords = packageJson.keywords.map((k: string) => k.toLowerCase());
        assert.ok(
            keywords.some((k: string) => k.includes('razor') || k.includes('asp.net') || k.includes('design')),
            'should have relevant keywords'
        );
    });

    test('package.json should have repository information', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(packageJson.repository, 'repository field is required');

        if (typeof packageJson.repository === 'string') {
            assert.ok(packageJson.repository.length > 0, 'repository URL should not be empty');
        } else {
            assert.ok(packageJson.repository.type, 'repository type is required');
            assert.ok(packageJson.repository.url, 'repository url is required');
        }
    });

    test('package.json should have icon specified', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(packageJson.icon, 'icon field should be specified');

        // Icon file should exist (can be .png or .svg during development)
        const iconFullPath = path.join(rootDir, packageJson.icon);
        const iconWithoutExt = iconFullPath.replace(/\.[^.]+$/, '');
        const iconExists = fs.existsSync(iconFullPath) ||
                          fs.existsSync(iconWithoutExt + '.png') ||
                          fs.existsSync(iconWithoutExt + '.svg');

        assert.ok(iconExists, `icon file should exist (tried ${packageJson.icon}, .png, or .svg)`);
    });

    test('README.md should exist and have content', () => {
        assert.ok(fs.existsSync(readmePath), 'README.md should exist');

        const content = fs.readFileSync(readmePath, 'utf8');
        assert.ok(content.length >= 100, 'README should have substantial content');

        // README should contain key sections
        assert.ok(content.includes('# Chain'), 'README should have title');
        assert.ok(
            content.toLowerCase().includes('feature') || content.toLowerCase().includes('usage'),
            'README should describe features or usage'
        );
        assert.ok(
            content.toLowerCase().includes('install'),
            'README should have installation instructions'
        );
    });

    test('package.json should have proper build scripts', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(packageJson.scripts, 'scripts section is required');
        assert.ok(packageJson.scripts['vscode:prepublish'], 'vscode:prepublish script is required');
        assert.ok(packageJson.scripts.compile, 'compile script is required');

        // Verify prepublish runs compilation
        assert.ok(
            packageJson.scripts['vscode:prepublish'].includes('compile') ||
            packageJson.scripts['vscode:prepublish'].includes('build'),
            'vscode:prepublish should compile the extension'
        );
    });

    test('package.json should define main entry point', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(packageJson.main, 'main entry point is required');

        // Main file should be in out/ directory after compilation
        assert.ok(
            packageJson.main.startsWith('./out/'),
            'main should point to compiled output'
        );
    });

    test('package.json should have license field', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(packageJson.license, 'license field is required for marketplace');

        // Common open source licenses
        const commonLicenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC'];
        assert.ok(
            commonLicenses.includes(packageJson.license) || packageJson.license === 'SEE LICENSE IN LICENSE',
            'license should be a standard identifier'
        );
    });

    test('package.json should have bugs/issues URL', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        assert.ok(
            packageJson.bugs,
            'bugs field helps users report issues'
        );

        if (typeof packageJson.bugs === 'string') {
            assert.ok(packageJson.bugs.includes('http'), 'bugs URL should be valid');
        } else {
            assert.ok(packageJson.bugs.url, 'bugs.url should be specified');
        }
    });

    test('package.json version should follow semver', () => {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
        assert.ok(
            semverRegex.test(packageJson.version),
            'version should follow semantic versioning (x.y.z)'
        );
    });
});
