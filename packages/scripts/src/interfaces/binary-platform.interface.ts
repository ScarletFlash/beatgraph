import { type GLIBC, type MUSL } from 'detect-libc';

export interface BinaryPlatform {
  readonly os: NodeJS.Platform;
  readonly cpu: NodeJS.Architecture;
  readonly libc?: typeof GLIBC | typeof MUSL;
}
