import { resolve } from 'path';
import { cwd } from 'process';
import { parseArgs } from 'util';
import { publishPlatformPackages } from '@beatgraph/scripts';

const DRY_RUN_OPTION_NAME = 'dry-run' as const;

const {
  positionals: [artifactsPath],
  values: { [DRY_RUN_OPTION_NAME]: isDryRun }
} = parseArgs({
  options: { [DRY_RUN_OPTION_NAME]: { type: 'boolean', default: false } },
  allowPositionals: true
});

if (artifactsPath === undefined) {
  throw new Error(`Usage: publish-platform-packages <artifacts directory> [--${DRY_RUN_OPTION_NAME}]`);
}

publishPlatformPackages({ packageRootPath: cwd(), artifactsPath: resolve(artifactsPath), isDryRun }).catch(
  (exception: unknown) => {
    throw exception;
  }
);
