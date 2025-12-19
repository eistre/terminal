import type { Locale } from '#shared/locale';
import type { EditableTopic } from '@terminal/database';
import slugify from '@sindresorhus/slugify';

export type EntitySelection = { kind: 'topic' } | { kind: 'task'; clientId: number };

export interface DraftTopicLocaleText {
  title: string;
  description: string;
}

export interface DraftTaskLocaleText {
  title: string;
  content: string;
  hint: string;
}

export interface DraftTask {
  clientId: number;
  id?: number;
  regex: string;
  watchPath: string | null;
  translations: Record<Locale, DraftTaskLocaleText>;
}

export interface DraftTopic {
  id: number;
  slug: string;
  slugEdited: boolean;
  translations: Record<Locale, DraftTopicLocaleText>;
  tasks: DraftTask[];
}

function emptyTopicLocale(): DraftTopicLocaleText {
  return { title: '', description: '' };
}

function emptyTaskLocale(): DraftTaskLocaleText {
  return { title: '', content: '', hint: '' };
}

function getLocaleValue<T extends { locale: Locale }>(items: T[], locale: Locale): T | undefined {
  return items.find(item => item.locale === locale);
}

export function getAutoSlug(enTitle: string, etTitle: string): string {
  const base = enTitle.trim() || etTitle.trim();
  return base.length > 0 ? slugify(base) : '';
}

export function deriveSlugEdited(currentSlug: string, enTitle: string, etTitle: string): boolean {
  return currentSlug !== getAutoSlug(enTitle, etTitle);
}

export function editableTopicToDraft(topic: EditableTopic): DraftTopic {
  const en = getLocaleValue(topic.translations, 'en');
  const et = getLocaleValue(topic.translations, 'et');

  const draftTasks: DraftTask[] = topic.tasks.map((task) => {
    const enTask = getLocaleValue(task.translations, 'en');
    const etTask = getLocaleValue(task.translations, 'et');

    return {
      clientId: task.id,
      id: task.id,
      regex: task.regex,
      watchPath: task.watchPath,
      translations: {
        en: {
          title: enTask?.title ?? '',
          content: enTask?.content ?? '',
          hint: enTask?.hint ?? '',
        },
        et: {
          title: etTask?.title ?? '',
          content: etTask?.content ?? '',
          hint: etTask?.hint ?? '',
        },
      },
    };
  });

  const enTitle = en?.title ?? '';
  const etTitle = et?.title ?? '';

  return {
    id: topic.id,
    slug: topic.slug,
    slugEdited: deriveSlugEdited(topic.slug, enTitle, etTitle),
    translations: {
      en: {
        title: enTitle,
        description: en?.description ?? '',
      },
      et: {
        title: etTitle,
        description: et?.description ?? '',
      },
    },
    tasks: draftTasks,
  };
}

export function createEmptyTask(clientId: number): DraftTask {
  return {
    clientId,
    regex: '',
    watchPath: null,
    translations: {
      en: emptyTaskLocale(),
      et: emptyTaskLocale(),
    },
  };
}

export function createEmptyTopic(id: number): DraftTopic {
  return {
    id,
    slug: '',
    slugEdited: false,
    translations: {
      en: emptyTopicLocale(),
      et: emptyTopicLocale(),
    },
    tasks: [],
  };
}
