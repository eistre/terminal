import type { EmailDomainSeed } from '../types/index.js';

export const defaultEmailDomains: EmailDomainSeed[] = [
  { domain: 'ut.ee', skipVerification: false },
  { domain: 'tlu.ee', skipVerification: false },
  { domain: 'taltech.ee', skipVerification: false },
];
