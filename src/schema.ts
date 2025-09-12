import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { ITimeRange } from './types';

// Emails table schema
export const emails = pgTable('emails', {
  name: text('name').notNull(),
  email: text('email').notNull(),
});

// Dashboard changes table schema
export const dashboardChanges = pgTable('dashboard_changes', {
  conceptid: integer('conceptid').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  shortdescription: text('shortdescription').notNull(),
  times: jsonb('times').$type<ITimeRange[]>().notNull(),
  menu: text('menu').notNull(),
  accepts_online_orders: boolean('accepts_online_orders').notNull(),
}); 