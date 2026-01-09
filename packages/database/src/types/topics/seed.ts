import type { tasks, taskTranslations, topics, topicTranslations } from '../../schema/index.js';

export interface TopicSeed {
  topic: typeof topics.$inferInsert;
  translations: Omit<typeof topicTranslations.$inferInsert, 'topicId'>[];
  tasks: {
    task: Omit<typeof tasks.$inferInsert, 'topicId' | 'taskOrder'>;
    translations: Omit<typeof taskTranslations.$inferInsert, 'taskId'>[];
  }[];
}
