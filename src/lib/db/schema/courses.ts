import { pgTable, text, timestamp, boolean, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  is_cbt: boolean("is_cbt").default(false),
  exam_type: text("exam_type"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  file_url: text("file_url").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  status: text("status").default("draft").notNull(),
  featured: boolean("featured").default(false).notNull(),
  view_count: integer("view_count").default(0).notNull(),
  completion_count: integer("completion_count").default(0),
  uploader_id: uuid("uploader_id").references(() => users.id),
  email_sent: boolean("email_sent").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  resource_id: uuid("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
