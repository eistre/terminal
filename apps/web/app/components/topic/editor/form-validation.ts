import type { Locale } from '#shared/locale';
import type { FormError } from '@nuxt/ui';
import type { DraftTopic } from './model';
import { upsertTopicPayloadSchema } from '#shared/topics-validation';
import { getSaveLocales, toUpsertPayload } from './payload';

type IssuePath = ReadonlyArray<PropertyKey>;

function normalizeIssuePath(issuePath: IssuePath, locales: readonly Locale[]): string {
  if (issuePath.length === 0) {
    return 'form';
  }

  const first = issuePath[0];

  if (first === 'topic' && issuePath[1] === 'slug') {
    return 'slug';
  }

  if (first === 'translations') {
    const translationIndex = issuePath[1];
    const field = issuePath[2];

    if (typeof translationIndex === 'number') {
      const locale = locales[translationIndex];
      if (locale && (field === 'title' || field === 'description')) {
        return `translations.${locale}.${field}`;
      }
    }

    return 'form';
  }

  if (first === 'tasks') {
    const taskIndex = issuePath[1];

    if (typeof taskIndex === 'number') {
      if (issuePath[2] === 'regex') {
        return `tasks.${taskIndex}.regex`;
      }

      if (issuePath[2] === 'watchPath') {
        return `tasks.${taskIndex}.watchPath`;
      }

      if (issuePath[2] === 'translations') {
        const translationIndex = issuePath[3];
        const field = issuePath[4];

        if (typeof translationIndex === 'number') {
          const locale = locales[translationIndex];
          if (locale && (field === 'title' || field === 'content' || field === 'hint')) {
            return `tasks.${taskIndex}.translations.${locale}.${field}`;
          }
        }

        return 'form';
      }

      return 'form';
    }

    return 'form';
  }

  return 'form';
}

export function validateDraft(draft: DraftTopic): FormError[] {
  const payload = toUpsertPayload(draft);
  const locales = getSaveLocales(draft);

  const result = upsertTopicPayloadSchema.safeParse(payload);
  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => {
    return {
      name: normalizeIssuePath(issue.path, locales),
      message: issue.message,
    };
  });
}
