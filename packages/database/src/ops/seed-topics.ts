import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { TopicSeed } from '../types/index.js';
import { tasks, taskTranslations, topics, topicTranslations } from '../schema/index.js';

export async function seedTopicsIfEmpty(db: MySql2Database, seeds: TopicSeed[]): Promise<boolean> {
  const topicCount = await db.$count(topics);
  if (topicCount > 0) {
    return false;
  }

  await db.transaction(async (tx) => {
    for (const seed of seeds) {
      const topic = await tx
        .insert(topics)
        .values(seed.topic)
        .$returningId();

      if (topic.length === 0) {
        throw new Error('Topic not created');
      }

      const { id: topicId } = topic[0]!;

      await tx.insert(topicTranslations)
        .values(seed.translations.map(translation => ({
          topicId,
          ...translation,
        })));

      const taskIds = await tx
        .insert(tasks)
        .values(seed.tasks.map((seedTask, index) => ({
          topicId,
          ...seedTask.task,
          taskOrder: index + 1,
        })))
        .$returningId();

      await tx.insert(taskTranslations)
        .values(taskIds.flatMap((taskRow, index) => {
          const seedTask = seed.tasks[index];

          if (!seedTask) {
            throw new Error('Seed task missing');
          }

          return seedTask.translations.map(translation => ({
            taskId: taskRow.id,
            ...translation,
          }));
        }));
    }
  });

  return true;
}
