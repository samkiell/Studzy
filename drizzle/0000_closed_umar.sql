-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bookmarks_user_id_resource_id_key" UNIQUE("user_id","resource_id")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"mode" text DEFAULT 'chat' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chat_messages_mode_check" CHECK (mode = ANY (ARRAY['chat'::text, 'image'::text, 'search'::text, 'code'::text])),
	CONSTRAINT "chat_messages_role_check" CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text]))
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"course_code" text NOT NULL,
	"mode" text,
	"total_questions" integer NOT NULL,
	"score" integer DEFAULT 0,
	"duration_seconds" integer DEFAULT 0,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"course_id" uuid,
	"time_limit_seconds" integer DEFAULT 1800,
	"question_ids" uuid[] DEFAULT '{""}',
	CONSTRAINT "attempts_mode_check" CHECK (mode = ANY (ARRAY['study'::text, 'exam'::text]))
);
--> statement-breakpoint
ALTER TABLE "attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_cbt" boolean DEFAULT false,
	"exam_type" text,
	CONSTRAINT "courses_code_key" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'New Chat' NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "theory_exams" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"instructions" text,
	"exam_mode" text DEFAULT 'study' NOT NULL,
	"max_selectable_questions" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "theory_exams_exam_mode_check" CHECK (exam_mode = ANY (ARRAY['study'::text, 'exam'::text]))
);
--> statement-breakpoint
ALTER TABLE "theory_exams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "theory_sub_questions" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"question_id" uuid NOT NULL,
	"label" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "theory_sub_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"total_score" numeric NOT NULL,
	"max_score" numeric NOT NULL,
	"percentage" numeric NOT NULL,
	"results_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "exam_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_material_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_path" text,
	"content" text,
	"embedding" vector(1024),
	"course_code" text,
	"level" text,
	"created_at" timestamp DEFAULT now(),
	"username" text
);
--> statement-breakpoint
ALTER TABLE "study_material_embeddings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_code" text NOT NULL,
	"question_id" integer NOT NULL,
	"difficulty" text,
	"topic" text,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option" text,
	"explanation" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"course_id" uuid,
	"question_type" text DEFAULT 'mcq' NOT NULL,
	"model_answer" text,
	"key_points" jsonb,
	"rubric" text,
	"sub_questions" jsonb,
	"bank_id" uuid,
	CONSTRAINT "questions_course_code_question_id_key" UNIQUE("course_code","question_id"),
	CONSTRAINT "questions_difficulty_check" CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
	CONSTRAINT "questions_question_type_check" CHECK (question_type = ANY (ARRAY['mcq'::text, 'theory'::text]))
);
--> statement-breakpoint
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "discussions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"full_name" text,
	"status" text DEFAULT 'active',
	"last_login" timestamp with time zone,
	"total_study_seconds" integer DEFAULT 0,
	"username" "citext",
	"avatar_url" text,
	"bio" text,
	"learning_goal" text,
	"current_streak" integer DEFAULT 0,
	"last_login_date" date,
	"longest_streak" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"email_confirmed_at" timestamp with time zone,
	CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
	CONSTRAINT "profiles_status_check" CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'deleted'::text]))
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'published' NOT NULL,
	"slug" text NOT NULL,
	"completion_count" integer DEFAULT 0,
	"featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"uploader_id" uuid,
	"email_sent" boolean DEFAULT false NOT NULL,
	CONSTRAINT "resources_course_id_slug_key" UNIQUE("course_id","slug"),
	CONSTRAINT "resources_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
	CONSTRAINT "resources_type_check" CHECK (type = ANY (ARRAY['audio'::text, 'video'::text, 'pdf'::text, 'image'::text, 'document'::text, 'question_bank'::text]))
);
--> statement-breakpoint
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "theory_questions" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"exam_id" uuid NOT NULL,
	"question_number" integer NOT NULL,
	"main_question" text NOT NULL,
	"marks" integer DEFAULT 10 NOT NULL,
	"model_answer" text NOT NULL,
	"key_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rubric" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "theory_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid,
	"question_id" uuid,
	"selected_option" text,
	"is_correct" boolean,
	"created_at" timestamp with time zone DEFAULT now(),
	"theory_answer" text,
	"ai_feedback" jsonb
);
--> statement-breakpoint
ALTER TABLE "attempt_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "theory_attempts" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_score" integer DEFAULT 0,
	"max_score" integer DEFAULT 0,
	"feedback" jsonb,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "theory_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_id" uuid,
	"last_accessed" timestamp with time zone DEFAULT now(),
	"action_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_activity_upsert_unique" UNIQUE("user_id","resource_id","action_type")
);
--> statement-breakpoint
ALTER TABLE "user_activity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "user_progress_user_id_resource_id_key" UNIQUE("user_id","resource_id")
);
--> statement-breakpoint
ALTER TABLE "user_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_presence" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"last_pulse" timestamp with time zone DEFAULT now(),
	CONSTRAINT "study_presence_pkey" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "study_presence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_exams" ADD CONSTRAINT "theory_exams_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_sub_questions" ADD CONSTRAINT "theory_sub_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."theory_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."discussions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_questions" ADD CONSTRAINT "theory_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."theory_exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_attempts" ADD CONSTRAINT "theory_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."theory_exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_attempts" ADD CONSTRAINT "theory_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_presence" ADD CONSTRAINT "study_presence_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_presence" ADD CONSTRAINT "study_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user" ON "bookmarks" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_messages_created_at" ON "chat_messages" USING btree ("session_id" timestamptz_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_messages_session_id" ON "chat_messages" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attempts_user_id" ON "attempts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_courses_code" ON "courses" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_pinned" ON "chat_sessions" USING btree ("user_id" bool_ops,"is_pinned" bool_ops) WHERE (is_pinned = true);--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_updated_at" ON "chat_sessions" USING btree ("user_id" timestamptz_ops,"updated_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_user_id" ON "chat_sessions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_theory_exams_course_id" ON "theory_exams" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_theory_sub_questions_question_id" ON "theory_sub_questions" USING btree ("question_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_exam_results_exam_id" ON "exam_results" USING btree ("exam_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_exam_results_user_id" ON "exam_results" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_embeddings_course_code" ON "study_material_embeddings" USING btree ("course_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_embeddings_file_path" ON "study_material_embeddings" USING btree ("file_path" text_ops);--> statement-breakpoint
CREATE INDEX "idx_embeddings_vector" ON "study_material_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "study_material_embeddings_embedding_idx" ON "study_material_embeddings" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_questions_bank_id" ON "questions" USING btree ("bank_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_questions_course_code" ON "questions" USING btree ("course_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_questions_course_id" ON "questions" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_questions_question_type" ON "questions" USING btree ("question_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_discussions_parent" ON "discussions" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_discussions_resource" ON "discussions" USING btree ("resource_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_resources_course_featured" ON "resources" USING btree ("course_id" uuid_ops,"featured" uuid_ops) WHERE (featured = true);--> statement-breakpoint
CREATE INDEX "idx_resources_course_id" ON "resources" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_resources_course_status" ON "resources" USING btree ("course_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_resources_featured" ON "resources" USING btree ("featured" bool_ops) WHERE (featured = true);--> statement-breakpoint
CREATE INDEX "idx_resources_slug" ON "resources" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_resources_status" ON "resources" USING btree ("status" text_ops) WHERE (status = 'published'::text);--> statement-breakpoint
CREATE INDEX "idx_resources_type" ON "resources" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "resources_uploader_id_idx" ON "resources" USING btree ("uploader_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_theory_questions_exam_id" ON "theory_questions" USING btree ("exam_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_attempt_answers_attempt_id" ON "attempt_answers" USING btree ("attempt_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_theory_attempts_exam_id" ON "theory_attempts" USING btree ("exam_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_theory_attempts_user_id" ON "theory_attempts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_activity_last_accessed" ON "user_activity" USING btree ("last_accessed" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_user_activity_user_id" ON "user_activity" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_progress_completed" ON "user_progress" USING btree ("user_id" bool_ops,"completed" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_user_progress_resource_id" ON "user_progress" USING btree ("resource_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_progress_user_id" ON "user_progress" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_study_presence_course" ON "study_presence" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_study_presence_pulse" ON "study_presence" USING btree ("last_pulse" timestamptz_ops);--> statement-breakpoint
CREATE POLICY "Users can manage their own bookmarks" ON "bookmarks" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Allow public read access for courses" ON "courses" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can update their own discussions" ON "discussions" AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can create discussions" ON "discussions" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Discussions are readable by everyone" ON "discussions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can read own profile" ON "profiles" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Public profiles are readable by everyone" ON "profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can update all profiles" ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Admins can read all profiles" ON "profiles" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Allow public read access for resources" ON "resources" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Users can read own activity" ON "user_activity" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can insert own activity" ON "user_activity" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can read all activity" ON "user_activity" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage their own presence" ON "study_presence" AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Presence is readable by everyone" ON "study_presence" AS PERMISSIVE FOR SELECT TO public;
*/