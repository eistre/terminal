import type { PublicConfig } from '#shared/public-config';

export function useConfig() {
  return useState<PublicConfig>('config');
}
