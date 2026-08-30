import * as path from 'path';

export interface ProjectInfo {
    name: string;
    path: string;
    directory: string;
}

export class ProjectDiscovery {
    constructor(
        private workspaceRoot: string,
        private findFiles: (pattern: string, exclude: string) => Promise<string[]>
    ) {}

    /**
     * Finds all .csproj files in the workspace
     * @returns Array of ProjectInfo objects sorted alphabetically by name
     */
    public async findProjects(): Promise<ProjectInfo[]> {
        const exclude = '**/node_modules/**,**/bin/**,**/obj/**';
        const files = await this.findFiles('**/*.csproj', exclude);

        const projects: ProjectInfo[] = files.map(filePath => {
            const directory = path.dirname(filePath);
            const basename = path.basename(filePath);
            const name = basename.replace(/\.csproj$/, '');

            return {
                name,
                path: filePath,
                directory
            };
        });

        // Sort alphabetically by name
        projects.sort((a, b) => a.name.localeCompare(b.name));

        return projects;
    }
}
