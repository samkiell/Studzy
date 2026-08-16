import { pgTable, index, foreignKey, unique, pgPolicy, uuid, timestamp, check, text, integer, boolean, numeric, jsonb, vector, date, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const bookmarks = pgTable("bookmarks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	resourceId: uuid("resource_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bookmarks_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "bookmarks_resource_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "bookmarks_user_id_fkey"
		}).onDelete("cascade"),
	unique("bookmarks_user_id_resource_id_key").on(table.userId, table.resourceId),
	pgPolicy("Users can manage their own bookmarks", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	mode: text().default('chat').notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_chat_messages_created_at").using("btree", table.sessionId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_chat_messages_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [chatSessions.id],
			name: "chat_messages_session_id_fkey"
		}).onDelete("cascade"),
	check("chat_messages_mode_check", sql`mode = ANY (ARRAY['chat'::text, 'image'::text, 'search'::text, 'code'::text])`),
	check("chat_messages_role_check", sql`role = ANY (ARRAY['user'::text, 'assistant'::text])`),
]);

export const attempts = pgTable("attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	courseCode: text("course_code").notNull(),
	mode: text(),
	totalQuestions: integer("total_questions").notNull(),
	score: integer().default(0),
	durationSeconds: integer("duration_seconds").default(0),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	courseId: uuid("course_id"),
	timeLimitSeconds: integer("time_limit_seconds").default(1800),
	questionIds: uuid("question_ids").array().default([""]),
}, (table) => [
	index("idx_attempts_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "attempts_course_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "attempts_user_id_fkey"
		}).onDelete("cascade"),
	check("attempts_mode_check", sql`mode = ANY (ARRAY['study'::text, 'exam'::text])`),
]);

export const courses = pgTable("courses", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	code: text().notNull(),
	title: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isCbt: boolean("is_cbt").default(false),
	examType: text("exam_type"),
}, (table) => [
	index("idx_courses_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
	unique("courses_code_key").on(table.code),
	pgPolicy("Allow public read access for courses", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
]);

export const chatSessions = pgTable("chat_sessions", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().default('New Chat').notNull(),
	isStarred: boolean("is_starred").default(false).notNull(),
	isPinned: boolean("is_pinned").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_chat_sessions_pinned").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isPinned.asc().nullsLast().op("bool_ops")).where(sql`(is_pinned = true)`),
	index("idx_chat_sessions_updated_at").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_chat_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_sessions_user_id_fkey"
		}).onDelete("cascade"),
]);

export const theoryExams = pgTable("theory_exams", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	title: text().notNull(),
	instructions: text(),
	examMode: text("exam_mode").default('study').notNull(),
	maxSelectableQuestions: integer("max_selectable_questions"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_theory_exams_course_id").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "theory_exams_course_id_fkey"
		}).onDelete("cascade"),
	check("theory_exams_exam_mode_check", sql`exam_mode = ANY (ARRAY['study'::text, 'exam'::text])`),
]);

export const theorySubQuestions = pgTable("theory_sub_questions", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	label: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_theory_sub_questions_question_id").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [theoryQuestions.id],
			name: "theory_sub_questions_question_id_fkey"
		}).onDelete("cascade"),
]);

export const examResults = pgTable("exam_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	examId: uuid("exam_id").notNull(),
	userId: uuid("user_id").notNull(),
	totalScore: numeric("total_score").notNull(),
	maxScore: numeric("max_score").notNull(),
	percentage: numeric().notNull(),
	resultsJson: jsonb("results_json").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_exam_results_exam_id").using("btree", table.examId.asc().nullsLast().op("uuid_ops")),
	index("idx_exam_results_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [courses.id],
			name: "exam_results_exam_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "exam_results_user_id_fkey"
		}).onDelete("cascade"),
]);

export const studyMaterialEmbeddings = pgTable("study_material_embeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	filePath: text("file_path"),
	content: text(),
	embedding: vector({ dimensions: 1024 }),
	courseCode: text("course_code"),
	level: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	username: text(),
}, (table) => [
	index("idx_embeddings_course_code").using("btree", table.courseCode.asc().nullsLast().op("text_ops")),
	index("idx_embeddings_file_path").using("btree", table.filePath.asc().nullsLast().op("text_ops")),
	index("idx_embeddings_vector").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({m: "16",ef_construction: "64"}),
	index("study_material_embeddings_embedding_idx").using("ivfflat", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({lists: "100"}),
]);

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseCode: text("course_code").notNull(),
	questionId: integer("question_id").notNull(),
	difficulty: text(),
	topic: text(),
	questionText: text("question_text").notNull(),
	options: jsonb().notNull(),
	correctOption: text("correct_option"),
	explanation: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	courseId: uuid("course_id"),
	questionType: text("question_type").default('mcq').notNull(),
	modelAnswer: text("model_answer"),
	keyPoints: jsonb("key_points"),
	rubric: text(),
	subQuestions: jsonb("sub_questions"),
	bankId: uuid("bank_id"),
}, (table) => [
	index("idx_questions_bank_id").using("btree", table.bankId.asc().nullsLast().op("uuid_ops")),
	index("idx_questions_course_code").using("btree", table.courseCode.asc().nullsLast().op("text_ops")),
	index("idx_questions_course_id").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	index("idx_questions_question_type").using("btree", table.questionType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.bankId],
			foreignColumns: [resources.id],
			name: "questions_bank_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "questions_course_id_fkey"
		}).onDelete("cascade"),
	unique("questions_course_code_question_id_key").on(table.courseCode, table.questionId),
	check("questions_difficulty_check", sql`difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])`),
	check("questions_question_type_check", sql`question_type = ANY (ARRAY['mcq'::text, 'theory'::text])`),
]);

export const discussions = pgTable("discussions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	resourceId: uuid("resource_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	parentId: uuid("parent_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_discussions_parent").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_discussions_resource").using("btree", table.resourceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "discussions_parent_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "discussions_resource_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "discussions_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update their own discussions", { as: "permissive", for: "update", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can create discussions", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Discussions are readable by everyone", { as: "permissive", for: "select", to: ["public"] }),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text(),
	role: text().default('user').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	fullName: text("full_name"),
	status: text().default('active'),
	lastLogin: timestamp("last_login", { withTimezone: true, mode: 'string' }),
	totalStudySeconds: integer("total_study_seconds").default(0),
	// TODO: failed to parse database type 'citext'
	username: unknown("username"),
	avatarUrl: text("avatar_url"),
	bio: text(),
	learningGoal: text("learning_goal"),
	currentStreak: integer("current_streak").default(0),
	lastLoginDate: date("last_login_date"),
	longestStreak: integer("longest_streak").default(0),
	isVerified: boolean("is_verified").default(false),
	emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "profiles_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can read own profile", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = id)` }),
	pgPolicy("Public profiles are readable by everyone", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can update all profiles", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can read all profiles", { as: "permissive", for: "select", to: ["public"] }),
	check("profiles_role_check", sql`role = ANY (ARRAY['user'::text, 'admin'::text])`),
	check("profiles_status_check", sql`status = ANY (ARRAY['active'::text, 'suspended'::text, 'deleted'::text])`),
]);

export const resources = pgTable("resources", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	title: text().notNull(),
	type: text().notNull(),
	fileUrl: text("file_url").notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	status: text().default('published').notNull(),
	slug: text().notNull(),
	completionCount: integer("completion_count").default(0),
	featured: boolean().default(false).notNull(),
	viewCount: integer("view_count").default(0).notNull(),
	uploaderId: uuid("uploader_id"),
	emailSent: boolean("email_sent").default(false).notNull(),
}, (table) => [
	index("idx_resources_course_featured").using("btree", table.courseId.asc().nullsLast().op("uuid_ops"), table.featured.asc().nullsLast().op("uuid_ops")).where(sql`(featured = true)`),
	index("idx_resources_course_id").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	index("idx_resources_course_status").using("btree", table.courseId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_resources_featured").using("btree", table.featured.asc().nullsLast().op("bool_ops")).where(sql`(featured = true)`),
	index("idx_resources_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_resources_status").using("btree", table.status.asc().nullsLast().op("text_ops")).where(sql`(status = 'published'::text)`),
	index("idx_resources_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("resources_uploader_id_idx").using("btree", table.uploaderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "resources_course_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploaderId],
			foreignColumns: [profiles.id],
			name: "resources_uploader_id_fkey"
		}).onDelete("set null"),
	unique("resources_course_id_slug_key").on(table.courseId, table.slug),
	pgPolicy("Allow public read access for resources", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	check("resources_status_check", sql`status = ANY (ARRAY['draft'::text, 'published'::text])`),
	check("resources_type_check", sql`type = ANY (ARRAY['audio'::text, 'video'::text, 'pdf'::text, 'image'::text, 'document'::text, 'question_bank'::text])`),
]);

export const theoryQuestions = pgTable("theory_questions", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	examId: uuid("exam_id").notNull(),
	questionNumber: integer("question_number").notNull(),
	mainQuestion: text("main_question").notNull(),
	marks: integer().default(10).notNull(),
	modelAnswer: text("model_answer").notNull(),
	keyPoints: jsonb("key_points").default([]).notNull(),
	rubric: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_theory_questions_exam_id").using("btree", table.examId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [theoryExams.id],
			name: "theory_questions_exam_id_fkey"
		}).onDelete("cascade"),
]);

export const attemptAnswers = pgTable("attempt_answers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attemptId: uuid("attempt_id"),
	questionId: uuid("question_id"),
	selectedOption: text("selected_option"),
	isCorrect: boolean("is_correct"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	theoryAnswer: text("theory_answer"),
	aiFeedback: jsonb("ai_feedback"),
}, (table) => [
	index("idx_attempt_answers_attempt_id").using("btree", table.attemptId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attemptId],
			foreignColumns: [attempts.id],
			name: "attempt_answers_attempt_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "attempt_answers_question_id_fkey"
		}).onDelete("cascade"),
]);

export const theoryAttempts = pgTable("theory_attempts", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	examId: uuid("exam_id").notNull(),
	answers: jsonb().default({}).notNull(),
	totalScore: integer("total_score").default(0),
	maxScore: integer("max_score").default(0),
	feedback: jsonb(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_theory_attempts_exam_id").using("btree", table.examId.asc().nullsLast().op("uuid_ops")),
	index("idx_theory_attempts_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [theoryExams.id],
			name: "theory_attempts_exam_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "theory_attempts_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userActivity = pgTable("user_activity", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	resourceId: uuid("resource_id"),
	lastAccessed: timestamp("last_accessed", { withTimezone: true, mode: 'string' }).defaultNow(),
	actionType: text("action_type").notNull(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_activity_last_accessed").using("btree", table.lastAccessed.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_user_activity_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "user_activity_resource_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_activity_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_activity_upsert_unique").on(table.userId, table.resourceId, table.actionType),
	pgPolicy("Users can read own activity", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can insert own activity", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can read all activity", { as: "permissive", for: "select", to: ["public"] }),
]);

export const userProgress = pgTable("user_progress", {
	id: uuid().default(sql`extensions.uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	resourceId: uuid("resource_id").notNull(),
	completed: boolean().default(false).notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_user_progress_completed").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.completed.asc().nullsLast().op("bool_ops")),
	index("idx_user_progress_resource_id").using("btree", table.resourceId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_progress_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "user_progress_resource_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_progress_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_progress_user_id_resource_id_key").on(table.userId, table.resourceId),
]);

export const studyPresence = pgTable("study_presence", {
	userId: uuid("user_id").notNull(),
	courseId: uuid("course_id").notNull(),
	lastPulse: timestamp("last_pulse", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_study_presence_course").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	index("idx_study_presence_pulse").using("btree", table.lastPulse.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "study_presence_course_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "study_presence_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.courseId], name: "study_presence_pkey"}),
	pgPolicy("Users can manage their own presence", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Presence is readable by everyone", { as: "permissive", for: "select", to: ["public"] }),
]);
