import { pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { courses, resources } from "./courses";

export const studyPresence = pgTable("study_presence", {
  user_id: uuid("user_id").references(() => users.id).notNull(),
  course_id: uuid("course_id").references(() => courses.id).notNull(),
  last_pulse: timestamp("last_pulse", { withTimezone: true }),
});

export const userActivity = pgTable("user_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  resource_id: uuid("resource_id").references(() => resources.id),
  last_accessed: timestamp("last_accessed", { withTimezone: true }),
  action_type: text("action_type").notNull(),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  resource_id: uuid("resource_id").references(() => resources.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

export const discussions = pgTable("discussions", {
  id: uuid("id").primaryKey().defaultRandom(),
  resource_id: uuid("resource_id").references(() => resources.id).notNull(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parent_id: uuid("parent_id"), // recursive relation
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
