import { spawn } from 'child_process';
import { createRequire } from 'module';
import { arch, argv, exit, kill, pid, platform } from 'process';
import { fileURLToPath } from 'url';
import { type } from 'arktype';
import { MUSL, family } from 'detect-libc';

const libcFamily = await family();
const platformKey = libcFamily === MUSL ? `${platform}-${arch}-${libcFamily}` : `${platform}-${arch}`;
const { optionalDependencies } = type({ optionalDependencies: 'Record<string, string>' }).assert(
  createRequire(import.meta.url)(`${process.env.npm_package_name}/package.json`)
);
const platformPackageName = Object.keys(optionalDependencies).find((dependencyName: string) =>
  dependencyName.endsWith(`-${platformKey}`)
);
if (platformPackageName === undefined) {
  throw new Error(`${platformKey} is not supported`);
}
const binaryPath = fileURLToPath(import.meta.resolve(platformPackageName));
const [, , ...binaryArguments] = argv;
const binaryChild = spawn(binaryPath, binaryArguments, { stdio: 'inherit' });

binaryChild.once('error', (error: Error) => {
  throw error;
});
binaryChild.once('exit', () => {
  if (binaryChild.signalCode !== null) {
    kill(pid, binaryChild.signalCode);
    return;
  }
  exit(binaryChild.exitCode);
});
