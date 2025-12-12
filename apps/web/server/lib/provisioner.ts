import type { ProvisionerSchema } from '@terminal/env/schemas';
import type { Provisioner } from '@terminal/provisioner';
import { createProvisioner } from '@terminal/provisioner';
import { useEnv } from '~~/server/lib/env';
import { useLogger } from '~~/server/lib/logger';

let _provisioner: Provisioner | undefined;

export function useProvisioner(): Provisioner {
  if (!_provisioner) {
    const env = useEnv();
    const logger = useLogger().child({ caller: 'provisioner' });

    _provisioner = createProvisioner(logger, env as ProvisionerSchema);
  }

  return _provisioner;
}
