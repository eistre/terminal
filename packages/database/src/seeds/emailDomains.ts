import type { EmailDomainSeed } from '../types';

export const defaultEmailDomains: EmailDomainSeed[] = [
  { domain: 'ut.ee', skipVerification: false },
  { domain: 'tlu.ee', skipVerification: false },
  { domain: 'taltech.ee', skipVerification: false },
];
