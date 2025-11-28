import { loadEnv } from '@terminal/env';
import { authSchema, databaseSchema, loggerSchema } from '@terminal/env/schemas';

const envSchema = authSchema
  .and(databaseSchema)
  .and(loggerSchema);

type EnvSchema = ReturnType<typeof loadEnv<typeof envSchema>>;

let _env: EnvSchema | undefined;

export function useEnv(): EnvSchema {
  if (!_env) {
    _env = loadEnv(envSchema);
  }

  return _env;
}
