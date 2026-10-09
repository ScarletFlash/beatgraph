import { type PackageManifest } from '@pnpm/types';
import { type } from 'arktype';

const publicationDirectoryType = type({ publishConfig: { directory: 'string' } });

export function getPublicationDirectory(manifest: PackageManifest): string {
  return publicationDirectoryType.assert(manifest).publishConfig.directory;
}
