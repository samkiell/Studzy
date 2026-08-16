import { pgTable, text, timestamp, uuid, integer, jsonb, numeric } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { courses } from "./courses";

export const theoryExams = pgTable("theory_exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  instructions: text("instructions"),
  exam_mode: text("exam_mode").notNull(),
  max_selectable_questions: integer("max_selectable_questions"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const theoryQuestions = pgTable("theory_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  exam_id: uuid("exam_id").references(() => theoryExams.id).notNull(),
  question_number: integer("question_number").notNull(),
  main_question: text("main_question").notNull(),
  marks: integer("marks").notNull(),
  model_answer: text("model_answer").notNull(),
  key_points: jsonb("key_points").notNull(),
  rubric: text("rubric"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const theorySubQuestions = pgTable("theory_sub_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  question_id: uuid("question_id").references(() => theoryQuestions.id).notNull(),
  label: text("label").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const theoryAttempts = pgTable("theory_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  exam_id: uuid("exam_id").references(() => theoryExams.id).notNull(),
  answers: jsonb("answers").notNull(),
  total_score: integer("total_score"),
  max_score: integer("max_score"),
  feedback: jsonb("feedback"),
  started_at: timestamp("started_at", { withTimezone: true }),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

export const examResults = pgTable("exam_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  exam_id: uuid("exam_id").references(() => theoryExams.id).notNull(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  total_score: numeric("total_score").notNull(),
  max_score: numeric("max_score").notNull(),
  percentage: numeric("percentage").notNull(),
  results_json: jsonb("results_json").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
