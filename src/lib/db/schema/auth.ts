import { timestamp, pgTable, text, primaryKey, integer, uuid, boolean, date } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").default("student").notNull(),
  status: text("status").default("active"),
  full_name: text("full_name"),
  username: text("username"),
  avatar_url: text("avatar_url"),
  bio: text("bio"),
  learning_goal: text("learning_goal"),
  current_streak: integer("current_streak").default(0),
  longest_streak: integer("longest_streak").default(0),
  total_study_seconds: integer("total_study_seconds").default(0),
  last_login_date: date("last_login_date"),
  last_login: timestamp("last_login", { withTimezone: true }),
  is_verified: boolean("is_verified").default(false),
  password_hash: text("password_hash"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]);

// Keep profiles as a legacy table reference to migrate existing data
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  role: text("role"),
  full_name: text("full_name"),
  status: text("status"),
  last_login: timestamp("last_login", { withTimezone: true }),
  total_study_seconds: integer("total_study_seconds"),
  username: text("username"),
  avatar_url: text("avatar_url"),
  bio: text("bio"),
  learning_goal: text("learning_goal"),
  current_streak: integer("current_streak"),
  last_login_date: date("last_login_date"),
  longest_streak: integer("longest_streak"),
  is_verified: boolean("is_verified"),
  email_confirmed_at: timestamp("email_confirmed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});
