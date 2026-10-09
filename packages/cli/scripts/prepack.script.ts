import { cwd } from 'process';
import { prepareManifestForPacking } from '@beatgraph/scripts';

prepareManifestForPacking(cwd()).catch((exception: unknown) => {
  throw exception;
});
