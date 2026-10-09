import { writeFile } from 'fs/promises';
import { join, posix } from 'path';
import { readPackageJson } from '@pnpm/pkg-manifest.reader';
import { type PackageManifest } from '@pnpm/types';
import { BINARY_PLATFORMS } from '../constants/binary-platforms.const';
import { FILE_ENCODING } from '../constants/file-encoding.const';
import { MANIFEST_FILE_NAME } from '../constants/manifest-file-name.const';
import { manifestBinType } from '../declarations/manifest-bin.type';
import { type BinaryPlatform } from '../interfaces/binary-platform.interface';
import { getPlatformKey } from './get-platform-key.function';
import { getPlatformPackagesPrefix } from './get-platform-packages-prefix.function';
import { getPublicationDirectory } from './get-publication-directory.function';

const RETAINED_FIELDS: Set<string> = new Set<keyof PackageManifest>([
  'dependencies',
  'description',
  'engines',
  'license',
  'repository',
  'type'
]);

export async function prepareManifestForPacking(packageRootPath: string): Promise<void> {
  const manifest = await readPackageJson(join(packageRootPath, MANIFEST_FILE_NAME));
  const { name, version, ...remainingFields }: PackageManifest = manifest;
  const { bin } = manifestBinType.assert(manifest);
  const publicationDirectory = getPublicationDirectory(manifest);
  const platformPackagesPrefix = getPlatformPackagesPrefix(manifest);

  const filteredManifestFields = Object.fromEntries(
    Object.entries(remainingFields).filter(([key]: [string, unknown]) => RETAINED_FIELDS.has(key))
  );

  const packingManifest: PackageManifest = {
    ...filteredManifestFields,
    name,
    version,
    bin: Object.fromEntries(
      Object.entries(bin).map(([command, path]: [string, string]) => [
        command,
        posix.relative(publicationDirectory, path)
      ])
    ),
    optionalDependencies: Object.fromEntries(
      BINARY_PLATFORMS.map((binaryPlatform: BinaryPlatform) => [
        `${platformPackagesPrefix}-${getPlatformKey(binaryPlatform)}`,
        version
      ])
    )
  };

  await writeFile(join(packageRootPath, publicationDirectory, MANIFEST_FILE_NAME), JSON.stringify(packingManifest), {
    encoding: FILE_ENCODING
  });
}
