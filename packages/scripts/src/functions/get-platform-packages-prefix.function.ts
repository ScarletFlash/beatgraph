import { posix } from 'path';
import { type PackageManifest } from '@pnpm/types';
import { type } from 'arktype';

const platformPackagesSourceType = type({ name: 'string', repository: { directory: 'string' } });

export function getPlatformPackagesPrefix(manifest: PackageManifest): `@${string}/${string}` {
  const { name, repository } = platformPackagesSourceType.assert(manifest);
  return `@${name}/${posix.basename(repository.directory)}`;
}
