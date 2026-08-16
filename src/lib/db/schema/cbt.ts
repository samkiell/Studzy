import { pgTable, text, timestamp, boolean, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { courses } from "./courses";

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => courses.id),
  course_code: text("course_code").notNull(),
  question_id: integer("question_id").notNull(),
  question_text: text("question_text").notNull(),
  options: jsonb("options").notNull(),
  correct_option: text("correct_option"),
  explanation: text("explanation"),
  topic: text("topic"),
  difficulty: text("difficulty"),
  question_type: text("question_type").default("multiple_choice").notNull(),
  model_answer: text("model_answer"),
  key_points: jsonb("key_points"),
  rubric: text("rubric"),
  sub_questions: jsonb("sub_questions"),
  bank_id: uuid("bank_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  course_id: uuid("course_id").references(() => courses.id),
  course_code: text("course_code").notNull(),
  mode: text("mode"),
  total_questions: integer("total_questions").notNull(),
  score: integer("score"),
  duration_seconds: integer("duration_seconds"),
  time_limit_seconds: integer("time_limit_seconds"),
  question_ids: text("question_ids").array(),
  started_at: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

export const attemptAnswers = pgTable("attempt_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  attempt_id: uuid("attempt_id").references(() => attempts.id, { onDelete: "cascade" }),
  question_id: uuid("question_id").references(() => questions.id),
  selected_option: text("selected_option"),
  is_correct: boolean("is_correct"),
  theory_answer: text("theory_answer"),
  ai_feedback: jsonb("ai_feedback"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
