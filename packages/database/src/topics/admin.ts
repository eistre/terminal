import type { MySql2Database } from 'drizzle-orm/mysql2';
import type {
  EditableTopic,
  Locale,
  TopicTaskTranslation,
  UpsertTopicInput,
  UpsertTopicResult,
} from '../types';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { tasks, taskTranslations, topics, topicTranslations } from '../schema';
import { TopicNotFoundError, TopicSlugConflictError } from './errors';

function validateUniqueLocales(items: { locale: Locale }[], errorMessage: string) {
  const locales = items.map(item => item.locale);
  const unique = new Set(locales);
  if (unique.size !== locales.length) {
    throw new Error(errorMessage);
  }
}

function validateHasAtLeastOneTranslation(items: { locale: Locale }[], errorMessage: string) {
  if (items.length === 0) {
    throw new Error(errorMessage);
  }
}

export function createTopicsAdminRepo(db: MySql2Database) {
  return {
    async getTopic(topicId: number): Promise<EditableTopic> {
      const [topicRow] = await db
        .select({ id: topics.id, slug: topics.slug })
        .from(topics)
        .where(eq(topics.id, topicId));

      if (!topicRow) {
        throw new TopicNotFoundError();
      }

      const translations = await db
        .select({
          locale: topicTranslations.locale,
          title: topicTranslations.title,
          description: topicTranslations.description,
        })
        .from(topicTranslations)
        .where(eq(topicTranslations.topicId, topicId));

      const taskRows = await db
        .select({ id: tasks.id, taskOrder: tasks.taskOrder, regex: tasks.regex, watchPath: tasks.watchPath })
        .from(tasks)
        .where(eq(tasks.topicId, topicId))
        .orderBy(tasks.taskOrder);

      const taskIds = taskRows.map(row => row.id);
      const taskTranslationRows = taskIds.length === 0
        ? []
        : await db
            .select({
              taskId: taskTranslations.taskId,
              locale: taskTranslations.locale,
              title: taskTranslations.title,
              content: taskTranslations.content,
              hint: taskTranslations.hint,
            })
            .from(taskTranslations)
            .where(inArray(taskTranslations.taskId, taskIds));

      const translationsByTaskId = new Map<number, TopicTaskTranslation[]>();
      for (const row of taskTranslationRows) {
        const list = translationsByTaskId.get(row.taskId) ?? [];
        translationsByTaskId.set(row.taskId, list);

        list.push({
          locale: row.locale,
          title: row.title,
          content: row.content,
          hint: row.hint,
        });
      }

      return {
        id: topicRow.id,
        slug: topicRow.slug,
        translations: translations.map(translationRow => ({
          locale: translationRow.locale,
          title: translationRow.title,
          description: translationRow.description,
        })),
        tasks: taskRows.map((task) => {
          return {
            id: task.id,
            taskOrder: task.taskOrder,
            regex: task.regex,
            watchPath: task.watchPath,
            translations: translationsByTaskId.get(task.id) ?? [],
          };
        }),
      };
    },

    async upsertTopic(input: UpsertTopicInput): Promise<UpsertTopicResult> {
      validateHasAtLeastOneTranslation(input.translations, 'Topic must have at least one translation');
      validateUniqueLocales(input.translations, 'Topic translations must have unique locales');

      for (const task of input.tasks) {
        validateHasAtLeastOneTranslation(task.translations, 'Task must have at least one translation');
        validateUniqueLocales(task.translations, 'Task translations must have unique locales');
      }

      try {
        return await db.transaction(async (tx) => {
          // 1) Get or insert the topic
          const topicId = await (async () => {
            if (input.topic.id) {
              await tx
                .update(topics)
                .set({ slug: input.topic.slug })
                .where(eq(topics.id, input.topic.id));

              return input.topic.id;
            }

            const [inserted] = await tx
              .insert(topics)
              .values({ slug: input.topic.slug })
              .$returningId();

            if (!inserted) {
              throw new Error('Topic not created');
            }

            return inserted.id;
          })();

          // 2) Remove and insert topic translations
          await tx.delete(topicTranslations).where(eq(topicTranslations.topicId, topicId));
          await tx.insert(topicTranslations).values(
            input.translations.map(translation => ({
              topicId,
              locale: translation.locale,
              title: translation.title,
              description: translation.description,
            })),
          );

          // 3) Remove old tasks
          const existingTaskRows = await tx
            .select({ id: tasks.id })
            .from(tasks)
            .where(eq(tasks.topicId, topicId));

          const existingTaskIds = new Set(existingTaskRows.map(r => r.id));
          const payloadTaskIds = new Set(input.tasks.map(t => t.id)
            .filter(id => id !== undefined));

          const tasksToDelete = [...existingTaskIds].filter(id => !payloadTaskIds.has(id));
          if (tasksToDelete.length > 0) {
            await tx.delete(tasks).where(inArray(tasks.id, tasksToDelete));
          }

          // 4.1) Temporarily offset existing tasks' order
          const payloadExistingTaskIds = input.tasks
            .map(task => task.id)
            .filter(id => id !== undefined);

          if (payloadExistingTaskIds.length > 0) {
            const temporaryOrderOffset = 10_000;
            await tx
              .update(tasks)
              .set({ taskOrder: sql`${tasks.taskOrder} + ${temporaryOrderOffset}` })
              .where(and(
                eq(tasks.topicId, topicId),
                inArray(tasks.id, payloadExistingTaskIds),
              ));
          }

          for (const [index, task] of input.tasks.entries()) {
            const taskOrder = index + 1;

            // 4.2) Get or insert task
            const taskId = await (async () => {
              if (task.id) {
                await tx
                  .update(tasks)
                  .set({ regex: task.regex, watchPath: task.watchPath, taskOrder })
                  .where(and(eq(tasks.id, task.id), eq(tasks.topicId, topicId)));

                return task.id;
              }

              const [inserted] = await tx
                .insert(tasks)
                .values({
                  topicId,
                  taskOrder,
                  regex: task.regex,
                  watchPath: task.watchPath,
                })
                .$returningId();

              if (!inserted) {
                throw new Error('Task not created');
              }

              return inserted.id;
            })();

            // 4.3) Remove and insert task translations
            await tx.delete(taskTranslations).where(eq(taskTranslations.taskId, taskId));
            await tx.insert(taskTranslations).values(
              task.translations.map(translation => ({
                taskId,
                locale: translation.locale,
                title: translation.title,
                content: translation.content,
                hint: translation.hint ?? null,
              })),
            );
          }

          return { topicId };
        });
      }
      catch (error: any) {
        if (error.cause.code === 'ER_DUP_ENTRY' && error.cause.message.includes('topics.topics_slug_unique')) {
          throw new TopicSlugConflictError();
        }

        throw error;
      }
    },

    async deleteTopic(topicId: number): Promise<void> {
      await db.delete(topics).where(eq(topics.id, topicId));
    },
  };
}
