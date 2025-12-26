import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core';

/**
 * Drizzle ORM データベーススキーマ定義
 */

/**
 * ユーザーテーブル
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * 課題テーブル
 */
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  taskNumber: serial('task_number').notNull().unique(),
  category: text('category').notNull(),
  problem: text('problem').notNull(),
  status: text('status').notNull(),
  deadline: timestamp('deadline'),
  relatedBusiness: text('related_business'),
  businessContent: text('business_content'),
  organization: text('organization'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull().references(() => users.id),
});

/**
 * 原因テーブル
 */
export const causes = pgTable('causes', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  cause: text('cause').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 対応案テーブル
 */
export const actions = pgTable('actions', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * 対応者テーブル
 */
export const assignees = pgTable('assignees', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  organization: text('organization'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
