import { GLIBC, MUSL } from 'detect-libc';
import { type BinaryPlatform } from '../interfaces/binary-platform.interface';

export const BINARY_PLATFORMS: readonly BinaryPlatform[] = [
  { os: 'darwin', cpu: 'arm64' },
  { os: 'darwin', cpu: 'x64' },
  { os: 'linux', cpu: 'arm64', libc: GLIBC },
  { os: 'linux', cpu: 'arm64', libc: MUSL },
  { os: 'linux', cpu: 'x64', libc: GLIBC },
  { os: 'linux', cpu: 'x64', libc: MUSL },
  { os: 'win32', cpu: 'x64' }
];
