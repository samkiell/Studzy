import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  is_starred: boolean("is_starred").default(false).notNull(),
  is_pinned: boolean("is_pinned").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: uuid("session_id").references(() => chatSessions.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  mode: text("mode").notNull(),
  image_url: text("image_url"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
