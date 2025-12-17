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

export interface SaveTopicTask {
  id?: number;
  regex: string;
  watchPath: string | null;
  translations: TopicTaskTranslation[];
}

export interface SaveTopic {
  topic: {
    id?: number;
    slug: string;
  };
  translations: TopicTranslation[];
  tasks: SaveTopicTask[];
}

export interface SaveTopicResult {
  topicId: number;
}

export interface TopicEditorTask {
  id: number;
  taskOrder: number;
  regex: string;
  watchPath: string | null;
  translations: TopicTaskTranslation[];
}

export interface TopicEditor {
  id: number;
  slug: string;
  translations: TopicTranslation[];
  tasks: TopicEditorTask[];
}
