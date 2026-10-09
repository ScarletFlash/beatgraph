import { rm } from 'fs/promises';
import { join } from 'path';
import { readPackageJson } from '@pnpm/pkg-manifest.reader';
import { MANIFEST_FILE_NAME } from '../constants/manifest-file-name.const';
import { getPublicationDirectory } from './get-publication-directory.function';

export async function removeManifestAfterPacking(packageRootPath: string): Promise<void> {
  const manifest = await readPackageJson(join(packageRootPath, MANIFEST_FILE_NAME));
  await rm(join(packageRootPath, getPublicationDirectory(manifest), MANIFEST_FILE_NAME));
}
