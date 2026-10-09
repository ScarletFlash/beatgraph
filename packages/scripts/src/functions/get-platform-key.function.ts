import { MUSL } from 'detect-libc';
import { type BinaryPlatform } from '../interfaces/binary-platform.interface';

export function getPlatformKey({
  os,
  cpu,
  libc
}: BinaryPlatform):
  `${NodeJS.Platform}-${NodeJS.Architecture}` | `${NodeJS.Platform}-${NodeJS.Architecture}-${typeof MUSL}` {
  return libc === MUSL ? `${os}-${cpu}-${libc}` : `${os}-${cpu}`;
}
