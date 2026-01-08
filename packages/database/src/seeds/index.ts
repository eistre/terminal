import type { EmailDomainSeed, TopicSeed } from '../types';
import { defaultEmailDomains } from './emailDomains';
import { intermediateTopic } from './intermediateTopic';
import { introTopic } from './introTopic';

export { intermediateTopic, introTopic };

export const defaultTopicSeeds: TopicSeed[] = [introTopic, intermediateTopic];

export const defaultEmailDomainSeeds: EmailDomainSeed[] = defaultEmailDomains;
