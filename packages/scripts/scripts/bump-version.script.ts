import { access, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';
import { type Project } from '@pnpm/types';
import { findWorkspaceProjectsNoCheck } from '@pnpm/workspace.projects-reader';
import { findWorkspaceDir } from '@pnpm/workspace.root-finder';
import { readWorkspaceManifest } from '@pnpm/workspace.workspace-manifest-reader';
import { regex } from 'arkregex';
import { FILE_ENCODING } from '../src/constants/file-encoding.const';
import { runCommand } from '../src/functions/run-command.function';

const CARGO_MANIFEST_FILE_NAME = 'Cargo.toml' as const;

const CARGO_WORKSPACE_VERSION_PATTERN = regex(
  '(?<versionAssignment>\\[workspace\\.package\\][^\\[]*?\nversion = )"[^"]*"'
);

const packageRootPath = cwd();
const workspaceRootPath = await findWorkspaceDir(packageRootPath);
if (workspaceRootPath === undefined) {
  throw new Error(`${packageRootPath} is not inside a pnpm workspace`);
}

await runCommand({ command: ['pnpm', 'run', 'changeset', 'version'], workingDirectoryPath: workspaceRootPath });

const workspaceManifest = await readWorkspaceManifest(workspaceRootPath);
const projects = await findWorkspaceProjectsNoCheck(workspaceRootPath, { patterns: workspaceManifest?.packages });
const cargoBackedProjects = await Promise.all(
  projects
    .filter(({ rootDir }: Project) => rootDir !== workspaceRootPath)
    .map(async (project: Project) =>
      access(join(project.rootDir, CARGO_MANIFEST_FILE_NAME)).then(
        () => [project],
        () => []
      )
    )
);
const [versionSourceProject, ...extraVersionSourceProjects] = cargoBackedProjects.flat();
if (versionSourceProject === undefined || extraVersionSourceProjects.length > 0) {
  throw new Error('Exactly one workspace package must share its directory with a Cargo crate');
}

const cargoManifestPath = join(workspaceRootPath, CARGO_MANIFEST_FILE_NAME);
const cargoManifest = await readFile(cargoManifestPath, { encoding: FILE_ENCODING });

if (!CARGO_WORKSPACE_VERSION_PATTERN.test(cargoManifest)) {
  throw new Error(`${cargoManifestPath} has no \`version\` in the \`[workspace.package]\` table`);
}

const updatedCargoManifest = cargoManifest.replace(
  CARGO_WORKSPACE_VERSION_PATTERN,
  `$<versionAssignment>"${versionSourceProject.manifest.version}"`
);
await writeFile(cargoManifestPath, updatedCargoManifest, { encoding: FILE_ENCODING });

await runCommand({ command: ['cargo', 'update', '--workspace'], workingDirectoryPath: workspaceRootPath });
await runCommand({ command: ['pnpm', 'install', '--lockfile-only'], workingDirectoryPath: workspaceRootPath });
