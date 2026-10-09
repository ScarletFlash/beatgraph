import { cwd } from 'process';
import { removeManifestAfterPacking } from '@beatgraph/scripts';

removeManifestAfterPacking(cwd()).catch((exception: unknown) => {
  throw exception;
});
