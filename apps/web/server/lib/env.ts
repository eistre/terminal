import { authSchema, databaseSchema, loadEnv, loggerSchema } from '@terminal/env';

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
