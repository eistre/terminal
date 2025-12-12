import { createAuthClient } from 'better-auth/vue';

export const authClient = createAuthClient();
// TODO look into this
export const { useSession } = authClient;
