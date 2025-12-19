import type { Locale } from './locale';
import { z } from 'zod';
import { localeSchema } from './locale';

type LocaleState = 'EMPTY' | 'PARTIAL' | 'FULL';

const allowedStates: ReadonlyArray<readonly [LocaleState, LocaleState]> = [
  ['FULL', 'EMPTY'],
  ['FULL', 'FULL'],
  ['EMPTY', 'FULL'],
];

function getLocaleState(input: UpsertTopicPayload, locale: Locale): LocaleState {
  const topicHas = input.translations.some(translation => translation.locale === locale);
  const anyTaskHas = input.tasks.some(task => task.translations.some(t => t.locale === locale));
  const allTasksHave = input.tasks.every(task => task.translations.some(t => t.locale === locale));

  const hasAny = topicHas || anyTaskHas;
  const isFull = topicHas && allTasksHave;

  if (!hasAny) {
    return 'EMPTY';
  }

  return isFull ? 'FULL' : 'PARTIAL';
}

function validateUniqueLocales(items: { locale: Locale }[]) {
  const locales = items.map(item => item.locale);
  return new Set(locales).size === locales.length;
}

export const upsertTopicPayloadSchema = z
  .object({
    topic: z.object({
      id: z.number().int().positive().optional(),
      slug: z.string().trim().min(1).max(255),
    }),
    translations: z.array(
      z.object({
        locale: localeSchema,
        title: z.string().trim().min(1).max(255),
        description: z.string().trim().min(1),
      }),
    )
      .min(1),
    tasks: z.array(
      z.object({
        id: z.number().int().positive().optional(),
        regex: z.string().trim().min(1).max(255),
        watchPath: z.string().trim().min(1).max(255).nullable(),
        translations: z.array(
          z.object({
            locale: localeSchema,
            title: z.string().trim().min(1).max(255),
            content: z.string().trim().min(1),
            hint: z.string().trim().min(1).nullable(),
          }),
        )
          .min(1),
      }),
    )
      .min(1),
  })
  .superRefine((value, ctx) => {
    if (!validateUniqueLocales(value.translations)) {
      ctx.addIssue({
        code: 'custom',
        path: ['translations'],
        message: 'Topic translations must have unique locales',
      });
    }

    for (const [index, task] of value.tasks.entries()) {
      if (!validateUniqueLocales(task.translations)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tasks', index, 'translations'],
          message: 'Task translations must have unique locales',
        });
      }
    }

    const enState = getLocaleState(value, 'en');
    const etState = getLocaleState(value, 'et');

    const isAllowed = allowedStates.some(([enAllowed, etAllowed]) => enAllowed === enState && etAllowed === etState);

    if (!isAllowed) {
      ctx.addIssue({
        code: 'custom',
        path: [],
        message: `Invalid topic locale state - EN=${enState}, ET=${etState} - Save requires FULL/EMPTY, FULL/FULL, or EMPTY/FULL`,
      });
    }
  });

export type UpsertTopicPayload = z.infer<typeof upsertTopicPayloadSchema>;
