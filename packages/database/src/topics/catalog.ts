import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { Locale, TopicDetails, TopicSummary } from '../types/index.js';
import { aliasedTable, and, countDistinct, eq, sql } from 'drizzle-orm';
import { taskCompletions, tasks, taskTranslations, topics, topicTranslations } from '../schema/index.js';
import { TopicNotFoundError } from './errors.js';

function getFallbackLocale(locale: Locale): Locale {
  return locale === 'en' ? 'et' : 'en';
}

export function createTopicsCatalogRepo(db: MySql2Database) {
  return {
    async getTopic(userId: string, slug: string, locale: Locale): Promise<TopicDetails> {
      const fallbackLocale = getFallbackLocale(locale);

      const requestedTopicTranslations = aliasedTable(topicTranslations, 'topic_translations_requested');
      const fallbackTopicTranslations = aliasedTable(topicTranslations, 'topic_translations_fallback');

      const requestedTaskTranslations = aliasedTable(taskTranslations, 'task_translations_requested');
      const fallbackTaskTranslations = aliasedTable(taskTranslations, 'task_translations_fallback');

      const rows = await db
        .select({
          topicTitle: sql<string>`coalesce(${requestedTopicTranslations.title}, ${fallbackTopicTranslations.title})`,
          topicDescription: sql<string>`coalesce(${requestedTopicTranslations.description}, ${fallbackTopicTranslations.description})`,

          taskId: tasks.id,
          taskTitle: sql<string>`coalesce(${requestedTaskTranslations.title}, ${fallbackTaskTranslations.title})`,
          taskContent: sql<string>`coalesce(${requestedTaskTranslations.content}, ${fallbackTaskTranslations.content})`,
          taskHint: sql<string | null>`coalesce(${requestedTaskTranslations.hint}, ${fallbackTaskTranslations.hint})`,

          completedTaskId: taskCompletions.taskId,
        })
        .from(topics)
        .leftJoin(requestedTopicTranslations, and(
          eq(requestedTopicTranslations.topicId, topics.id),
          eq(requestedTopicTranslations.locale, locale),
        ))
        .leftJoin(fallbackTopicTranslations, and(
          eq(fallbackTopicTranslations.topicId, topics.id),
          eq(fallbackTopicTranslations.locale, fallbackLocale),
        ))
        .innerJoin(tasks, eq(tasks.topicId, topics.id))
        .leftJoin(requestedTaskTranslations, and(
          eq(requestedTaskTranslations.taskId, tasks.id),
          eq(requestedTaskTranslations.locale, locale),
        ))
        .leftJoin(fallbackTaskTranslations, and(
          eq(fallbackTaskTranslations.taskId, tasks.id),
          eq(fallbackTaskTranslations.locale, fallbackLocale),
        ))
        .leftJoin(taskCompletions, and(
          eq(taskCompletions.taskId, tasks.id),
          eq(taskCompletions.userId, userId),
        ))
        .where(eq(topics.slug, slug))
        .orderBy(tasks.taskOrder);

      if (rows.length === 0) {
        throw new TopicNotFoundError();
      }

      const [firstRow] = rows;
      const { topicTitle, topicDescription } = firstRow!;

      return {
        title: topicTitle,
        description: topicDescription,
        tasks: rows.map(row => ({
          id: row.taskId,
          title: row.taskTitle,
          content: row.taskContent,
          hint: row.taskHint,
          completed: row.completedTaskId !== null,
        })),
      };
    },

    async getTopics(userId: string, locale: Locale): Promise<TopicSummary[]> {
      const fallbackLocale = getFallbackLocale(locale);

      const requestedTopicTranslations = aliasedTable(topicTranslations, 'topic_translations_requested');
      const fallbackTopicTranslations = aliasedTable(topicTranslations, 'topic_translations_fallback');

      const rows = await db
        .select({
          id: topics.id,
          slug: topics.slug,
          title: sql<string>`coalesce(${requestedTopicTranslations.title}, ${fallbackTopicTranslations.title})`,
          description: sql<string>`coalesce(${requestedTopicTranslations.description}, ${fallbackTopicTranslations.description})`,
          totalTasks: countDistinct(tasks.id),
          completedTasks: countDistinct(taskCompletions.taskId),
        })
        .from(topics)
        .leftJoin(requestedTopicTranslations, and(
          eq(requestedTopicTranslations.topicId, topics.id),
          eq(requestedTopicTranslations.locale, locale),
        ))
        .leftJoin(fallbackTopicTranslations, and(
          eq(fallbackTopicTranslations.topicId, topics.id),
          eq(fallbackTopicTranslations.locale, fallbackLocale),
        ))
        .leftJoin(tasks, eq(tasks.topicId, topics.id))
        .leftJoin(taskCompletions, and(
          eq(taskCompletions.taskId, tasks.id),
          eq(taskCompletions.userId, userId),
        ))
        .groupBy(
          topics.id,
          topics.slug,
          requestedTopicTranslations.title,
          requestedTopicTranslations.description,
          fallbackTopicTranslations.title,
          fallbackTopicTranslations.description,
        )
        .orderBy(topics.id);

      return rows.map((row) => {
        const total = row.totalTasks;
        const completed = row.completedTasks;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          progress,
        };
      });
    },
  };
}
