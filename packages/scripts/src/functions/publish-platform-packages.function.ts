import { execFile } from 'child_process';
import { cp, mkdtemp, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, sep } from 'path';
import { promisify } from 'util';
import { readPackageJson } from '@pnpm/pkg-manifest.reader';
import { type PackageManifest } from '@pnpm/types';
import { type } from 'arktype';
import { BINARY_PLATFORMS } from '../constants/binary-platforms.const';
import { FILE_ENCODING } from '../constants/file-encoding.const';
import { MANIFEST_FILE_NAME } from '../constants/manifest-file-name.const';
import { manifestBinType } from '../declarations/manifest-bin.type';
import { type BinaryPlatform } from '../interfaces/binary-platform.interface';
import { getPlatformKey } from './get-platform-key.function';
import { getPlatformPackagesPrefix } from './get-platform-packages-prefix.function';
import { runCommand } from './run-command.function';

const PNPM_EXECUTABLE = 'pnpm' as const;

const publishedVersionsType = type('string.json.parse').to('string[]');

interface PublishPlatformPackagesParams {
  readonly packageRootPath: string;
  readonly artifactsPath: string;
  readonly isDryRun?: boolean;
}

interface PlatformPackage {
  readonly manifest: PackageManifest;
  readonly executableName: string;
  readonly executablePath: string;
}

export async function publishPlatformPackages({
  packageRootPath,
  artifactsPath,
  isDryRun = false
}: PublishPlatformPackagesParams): Promise<void> {
  const cliManifest = await readPackageJson(join(packageRootPath, MANIFEST_FILE_NAME));
  const [binaryName, ...extraBinaryNames] = Object.keys(manifestBinType.assert({ bin: cliManifest.bin }).bin);
  if (binaryName === undefined || extraBinaryNames.length > 0) {
    throw new Error(`${cliManifest.name} must declare exactly one \`bin\` entry`);
  }
  const platformPackagesPrefix = getPlatformPackagesPrefix(cliManifest);

  const artifactNames = BINARY_PLATFORMS.map(
    (binaryPlatform: BinaryPlatform) => `${binaryName}-${getPlatformKey(binaryPlatform)}`
  );
  const unknownArtifactNames = (await readdir(artifactsPath)).filter(
    (artifactName: string) => !artifactNames.includes(artifactName)
  );
  if (unknownArtifactNames.length > 0) {
    throw new Error(`Artifacts for platforms missing from BINARY_PLATFORMS: ${unknownArtifactNames.join(', ')}`);
  }

  const platformPackages = await Promise.all(
    BINARY_PLATFORMS.map(async (binaryPlatform: BinaryPlatform) => {
      const platformKey = getPlatformKey(binaryPlatform);
      const artifactPath = join(artifactsPath, `${binaryName}-${platformKey}`);
      const [executableName, ...extraFileNames] = await readdir(artifactPath);
      if (executableName === undefined || extraFileNames.length > 0) {
        throw new Error(`${artifactPath} must contain exactly one executable`);
      }

      const { os, cpu, libc } = binaryPlatform;
      return {
        manifest: {
          name: `${platformPackagesPrefix}-${platformKey}`,
          version: cliManifest.version,
          description: `The ${platformKey} binary for ${cliManifest.name}`,
          license: cliManifest.license,
          repository: cliManifest.repository,
          os: [os],
          cpu: [cpu],
          libc: libc === undefined ? undefined : [libc],
          exports: { '.': `./${executableName}` },
          files: [executableName],
          publishConfig: {
            executableFiles: [executableName]
          }
        },
        executableName,
        executablePath: join(artifactPath, executableName)
      };
    })
  );

  await Promise.all(
    platformPackages.map(async ({ manifest, executableName, executablePath }: PlatformPackage) => {
      const isVersionPublished = await promisify(execFile)(PNPM_EXECUTABLE, [
        'view',
        manifest.name,
        'versions',
        '--json'
      ]).then(
        ({ stdout }: { stdout: string }) => publishedVersionsType.assert(stdout).includes(manifest.version),
        () => false
      );
      if (isVersionPublished) {
        console.warn(`${manifest.name}@${manifest.version} is already published, skipping`);
        return;
      }

      const packageDirectoryPath = await mkdtemp(`${tmpdir()}${sep}`);
      try {
        await cp(executablePath, join(packageDirectoryPath, executableName));
        await writeFile(join(packageDirectoryPath, MANIFEST_FILE_NAME), JSON.stringify(manifest), {
          encoding: FILE_ENCODING
        });
        await runCommand({
          command: [
            PNPM_EXECUTABLE,
            'publish',
            '--access',
            'public',
            '--no-git-checks',
            ...(isDryRun ? ['--dry-run'] : [])
          ],
          workingDirectoryPath: packageDirectoryPath
        });
      } finally {
        await rm(packageDirectoryPath, { recursive: true, force: true });
      }
    })
  );
}
