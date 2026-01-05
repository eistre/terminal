import type { Locale } from '#shared/locale';
import type { UpsertTopicInput, UpsertTopicTask } from '@terminal/database';
import type { DraftTopic } from './model';

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

function toOptionalNull(value: string): string | null {
  return isNonEmpty(value) ? value.trim() : null;
}

export function getSaveLocales(draft: DraftTopic): Locale[] {
  const enEnabled = isNonEmpty(draft.translations.en.title);
  const etEnabled = isNonEmpty(draft.translations.et.title);

  if (enEnabled && etEnabled) {
    return ['en', 'et'];
  }

  if (enEnabled) {
    return ['en'];
  }

  if (etEnabled) {
    return ['et'];
  }

  return ['en'];
}

export function toUpsertPayload(draft: DraftTopic): UpsertTopicInput {
  const locales = getSaveLocales(draft);

  const topic = draft.id === undefined
    ? { slug: draft.slug }
    : { id: draft.id, slug: draft.slug };

  return {
    topic,
    translations: locales.map(locale => ({
      locale,
      title: draft.translations[locale].title.trim(),
      description: draft.translations[locale].description.trim(),
    })),
    tasks: draft.tasks.map<UpsertTopicTask>((task) => {
      return {
        id: task.id,
        regex: task.regex.trim(),
        watchPath: toOptionalNull(task.watchPath),
        translations: locales.map(locale => ({
          locale,
          title: task.translations[locale].title.trim(),
          content: task.translations[locale].content.trim(),
          hint: toOptionalNull(task.translations[locale].hint),
        })),
      };
    }),
  };
}
