import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { EvaluatorTaskRecord } from '../types';
import { and, eq, inArray } from 'drizzle-orm';
import { taskCompletions, tasks, topics } from '../schema';
import { TopicNotFoundError } from './errors';

export function createTopicsCompletionRepo(db: MySql2Database) {
  return {
    async getEvaluatorTasks(userId: string, slug: string): Promise<EvaluatorTaskRecord[]> {
      const rows = await db
        .select({
          id: tasks.id,
          regex: tasks.regex,
          watchPath: tasks.watchPath,
          completedTaskId: taskCompletions.taskId,
        })
        .from(tasks)
        .innerJoin(topics, eq(tasks.topicId, topics.id))
        .leftJoin(taskCompletions, and(
          eq(taskCompletions.taskId, tasks.id),
          eq(taskCompletions.userId, userId),
        ))
        .where(eq(topics.slug, slug))
        .orderBy(tasks.taskOrder);

      if (rows.length === 0) {
        throw new TopicNotFoundError();
      }

      return rows.map(row => ({
        id: row.id,
        regex: row.regex,
        watchPath: row.watchPath,
        completed: row.completedTaskId !== null,
      }));
    },

    async completeTasks(userId: string, taskIds: number[]): Promise<void> {
      if (taskIds.length === 0) {
        return;
      }

      const uniqueTaskIds = Array.from(new Set(taskIds));
      const taskRows = await db
        .select({ taskId: tasks.id, topicId: tasks.topicId })
        .from(tasks)
        .where(inArray(tasks.id, uniqueTaskIds));

      if (taskRows.length === 0) {
        return;
      }

      await db
        .insert(taskCompletions)
        .ignore()
        .values(taskRows.map(row => ({
          userId,
          taskId: row.taskId,
          topicId: row.topicId,
        })));
    },

    async resetTopic(userId: string, slug: string): Promise<void> {
      const [row] = await db
        .select({ topicId: topics.id })
        .from(topics)
        .where(eq(topics.slug, slug));

      if (!row) {
        throw new TopicNotFoundError();
      }

      await db
        .delete(taskCompletions)
        .where(and(
          eq(taskCompletions.userId, userId),
          eq(taskCompletions.topicId, row.topicId),
        ));
    },
  };
}
