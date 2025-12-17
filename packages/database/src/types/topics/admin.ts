import type { Locale } from '../common';

export interface TopicTranslation {
  locale: Locale;
  title: string;
  description: string;
}

export interface TopicTaskTranslation {
  locale: Locale;
  title: string;
  content: string;
  hint: string | null;
}

export interface UpsertTopicTask {
  id?: number;
  regex: string;
  watchPath: string | null;
  translations: TopicTaskTranslation[];
}

export interface UpsertTopicInput {
  topic: {
    id?: number;
    slug: string;
  };
  translations: TopicTranslation[];
  tasks: UpsertTopicTask[];
}

export interface UpsertTopicResult {
  topicId: number;
}

export interface EditableTopicTask {
  id: number;
  taskOrder: number;
  regex: string;
  watchPath: string | null;
  translations: TopicTaskTranslation[];
}

export interface EditableTopic {
  id: number;
  slug: string;
  translations: TopicTranslation[];
  tasks: EditableTopicTask[];
}
