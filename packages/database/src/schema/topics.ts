import { index, int, mysqlEnum, mysqlTable, text, timestamp, unique, varchar } from 'drizzle-orm/mysql-core';
import { users } from './auth';

const localeEnum = mysqlEnum('locale', ['en', 'et']);

export const topics = mysqlTable('topics', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const topicTranslations = mysqlTable('topic_translations', {
  id: int('id').autoincrement().primaryKey(),
  topicId: int('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
  locale: localeEnum.notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, table => [
  unique('topic_translations_topic_locale_unique').on(table.topicId, table.locale),
]);

export const tasks = mysqlTable('tasks', {
  id: int('id').autoincrement().primaryKey(),
  topicId: int('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
  taskOrder: int('task_order').notNull(),
  regex: varchar('regex', { length: 255 }).notNull(),
  watchPath: varchar('watch_path', { length: 255 }), // inotify watch path
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, table => [
  unique('tasks_topic_order_unique').on(table.topicId, table.taskOrder),
  index('tasks_topic_idx').on(table.topicId),
]);

export const taskTranslations = mysqlTable('task_translations', {
  id: int('id').autoincrement().primaryKey(),
  taskId: int('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  locale: localeEnum.notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  hint: text('hint'),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, table => [
  unique('task_translations_task_locale_unique').on(table.taskId, table.locale),
]);

export const completedTasks = mysqlTable('completed_tasks', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: int('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, table => [
  unique('completed_tasks_user_task_unique').on(table.userId, table.taskId),
]);
