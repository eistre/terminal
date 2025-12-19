import type { Locale } from '#shared/locale';
import type { DraftTask, DraftTopic } from './model';

export type TaskLocaleMode
  = | { kind: 'single'; locale: Locale }
    | { kind: 'dual'; locales: [Locale, Locale] };

type ReadinessChip
  = | { label: 'OK'; color: 'success' }
    | { label: 'MISSING'; color: 'warning' };

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

function isTopicLocaleEnabledByTitle(draft: DraftTopic, locale: Locale): boolean {
  return isNonEmpty(draft.translations[locale].title);
}

export function getTaskLocaleModeFromTopicTitle(draft: DraftTopic, fallbackLocale: Locale): TaskLocaleMode {
  const enEnabled = isTopicLocaleEnabledByTitle(draft, 'en');
  const etEnabled = isTopicLocaleEnabledByTitle(draft, 'et');

  if (enEnabled && etEnabled) {
    return { kind: 'dual', locales: ['en', 'et'] };
  }

  if (enEnabled) {
    return { kind: 'single', locale: 'en' };
  }

  if (etEnabled) {
    return { kind: 'single', locale: 'et' };
  }

  return { kind: 'single', locale: fallbackLocale };
}

export function isTaskCompleteInLocale(task: DraftTask, locale: Locale) {
  return isNonEmpty(task.regex)
    && isNonEmpty(task.translations[locale].title)
    && isNonEmpty(task.translations[locale].content);
}

export function getTaskReadinessChip(task: DraftTask, mode: TaskLocaleMode): ReadinessChip {
  const complete = mode.kind === 'dual'
    ? mode.locales.every(locale => isTaskCompleteInLocale(task, locale))
    : isTaskCompleteInLocale(task, mode.locale);

  return complete
    ? { label: 'OK', color: 'success' }
    : { label: 'MISSING', color: 'warning' };
}
