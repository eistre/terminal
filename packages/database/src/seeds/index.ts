import type { EmailDomainSeed, TopicSeed } from '../types/index.js';
import { defaultEmailDomains } from './emailDomains.js';
import { intermediateTopic } from './intermediateTopic.js';
import { introTopic } from './introTopic.js';

export { intermediateTopic, introTopic };

export const defaultTopicSeeds: TopicSeed[] = [introTopic, intermediateTopic];

export const defaultEmailDomainSeeds: EmailDomainSeed[] = defaultEmailDomains;
