import type { TopicSeed } from '../types';
import { intermediateTopic } from './intermediateTopic';
import { introTopic } from './introTopic';

export { intermediateTopic, introTopic };

export const defaultTopicSeeds: TopicSeed[] = [introTopic, intermediateTopic];
