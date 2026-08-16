CREATE TABLE "accounts" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"role" text DEFAULT 'student' NOT NULL,
	"status" text DEFAULT 'active',
	"full_name" text,
	"username" text,
	"avatar_url" text,
	"bio" text,
	"learning_goal" text,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"total_study_seconds" integer DEFAULT 0,
	"last_login_date" date,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "discussions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_presence" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_activity" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_progress" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attempt_answers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "questions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookmarks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resources" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "exam_results" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "theory_attempts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "theory_exams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "theory_questions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "theory_sub_questions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_material_embeddings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_user_id_resource_id_key";--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_code_key";--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_course_code_question_id_key";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_course_id_slug_key";--> statement-breakpoint
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_upsert_unique";--> statement-breakpoint
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_user_id_resource_id_key";--> statement-breakpoint
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_mode_check";--> statement-breakpoint
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_role_check";--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_mode_check";--> statement-breakpoint
ALTER TABLE "theory_exams" DROP CONSTRAINT "theory_exams_exam_mode_check";--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_difficulty_check";--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_question_type_check";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_role_check";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_status_check";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_status_check";--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_type_check";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_resource_id_fkey";
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_session_id_fkey";
--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_course_id_fkey";
--> statement-breakpoint
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "chat_sessions" DROP CONSTRAINT "chat_sessions_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "theory_exams" DROP CONSTRAINT "theory_exams_course_id_fkey";
--> statement-breakpoint
ALTER TABLE "theory_sub_questions" DROP CONSTRAINT "theory_sub_questions_question_id_fkey";
--> statement-breakpoint
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_exam_id_fkey";
--> statement-breakpoint
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_bank_id_fkey";
--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_course_id_fkey";
--> statement-breakpoint
ALTER TABLE "discussions" DROP CONSTRAINT "discussions_parent_id_fkey";
--> statement-breakpoint
ALTER TABLE "discussions" DROP CONSTRAINT "discussions_resource_id_fkey";
--> statement-breakpoint
ALTER TABLE "discussions" DROP CONSTRAINT "discussions_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_fkey";
--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_course_id_fkey";
--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_uploader_id_fkey";
--> statement-breakpoint
ALTER TABLE "theory_questions" DROP CONSTRAINT "theory_questions_exam_id_fkey";
--> statement-breakpoint
ALTER TABLE "attempt_answers" DROP CONSTRAINT "attempt_answers_attempt_id_fkey";
--> statement-breakpoint
ALTER TABLE "attempt_answers" DROP CONSTRAINT "attempt_answers_question_id_fkey";
--> statement-breakpoint
ALTER TABLE "theory_attempts" DROP CONSTRAINT "theory_attempts_exam_id_fkey";
--> statement-breakpoint
ALTER TABLE "theory_attempts" DROP CONSTRAINT "theory_attempts_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_resource_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_resource_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "study_presence" DROP CONSTRAINT "study_presence_course_id_fkey";
--> statement-breakpoint
ALTER TABLE "study_presence" DROP CONSTRAINT "study_presence_user_id_fkey";
--> statement-breakpoint
DROP INDEX "idx_bookmarks_user";--> statement-breakpoint
DROP INDEX "idx_chat_messages_created_at";--> statement-breakpoint
DROP INDEX "idx_chat_messages_session_id";--> statement-breakpoint
DROP INDEX "idx_attempts_user_id";--> statement-breakpoint
DROP INDEX "idx_courses_code";--> statement-breakpoint
DROP INDEX "idx_chat_sessions_pinned";--> statement-breakpoint
DROP INDEX "idx_chat_sessions_updated_at";--> statement-breakpoint
DROP INDEX "idx_chat_sessions_user_id";--> statement-breakpoint
DROP INDEX "idx_theory_exams_course_id";--> statement-breakpoint
DROP INDEX "idx_theory_sub_questions_question_id";--> statement-breakpoint
DROP INDEX "idx_exam_results_exam_id";--> statement-breakpoint
DROP INDEX "idx_exam_results_user_id";--> statement-breakpoint
DROP INDEX "idx_embeddings_course_code";--> statement-breakpoint
DROP INDEX "idx_embeddings_file_path";--> statement-breakpoint
DROP INDEX "idx_embeddings_vector";--> statement-breakpoint
DROP INDEX "study_material_embeddings_embedding_idx";--> statement-breakpoint
DROP INDEX "idx_questions_bank_id";--> statement-breakpoint
DROP INDEX "idx_questions_course_code";--> statement-breakpoint
DROP INDEX "idx_questions_course_id";--> statement-breakpoint
DROP INDEX "idx_questions_question_type";--> statement-breakpoint
DROP INDEX "idx_discussions_parent";--> statement-breakpoint
DROP INDEX "idx_discussions_resource";--> statement-breakpoint
DROP INDEX "idx_resources_course_featured";--> statement-breakpoint
DROP INDEX "idx_resources_course_id";--> statement-breakpoint
DROP INDEX "idx_resources_course_status";--> statement-breakpoint
DROP INDEX "idx_resources_featured";--> statement-breakpoint
DROP INDEX "idx_resources_slug";--> statement-breakpoint
DROP INDEX "idx_resources_status";--> statement-breakpoint
DROP INDEX "idx_resources_type";--> statement-breakpoint
DROP INDEX "resources_uploader_id_idx";--> statement-breakpoint
DROP INDEX "idx_theory_questions_exam_id";--> statement-breakpoint
DROP INDEX "idx_attempt_answers_attempt_id";--> statement-breakpoint
DROP INDEX "idx_theory_attempts_exam_id";--> statement-breakpoint
DROP INDEX "idx_theory_attempts_user_id";--> statement-breakpoint
DROP INDEX "idx_user_activity_last_accessed";--> statement-breakpoint
DROP INDEX "idx_user_activity_user_id";--> statement-breakpoint
DROP INDEX "idx_user_progress_completed";--> statement-breakpoint
DROP INDEX "idx_user_progress_resource_id";--> statement-breakpoint
DROP INDEX "idx_user_progress_user_id";--> statement-breakpoint
DROP INDEX "idx_study_presence_course";--> statement-breakpoint
DROP INDEX "idx_study_presence_pulse";--> statement-breakpoint
ALTER TABLE "study_presence" DROP CONSTRAINT "study_presence_pkey";--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "duration_seconds" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "time_limit_seconds" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "question_ids" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "question_ids" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "title" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_exams" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "theory_exams" ALTER COLUMN "exam_mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_sub_questions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "study_material_embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector;--> statement-breakpoint
ALTER TABLE "study_material_embeddings" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question_type" SET DEFAULT 'multiple_choice';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "total_study_seconds" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "username" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "current_streak" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "longest_streak" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "is_verified" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "theory_questions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "theory_questions" ALTER COLUMN "marks" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_questions" ALTER COLUMN "key_points" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_attempts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "theory_attempts" ALTER COLUMN "answers" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_attempts" ALTER COLUMN "total_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_attempts" ALTER COLUMN "max_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "theory_attempts" ALTER COLUMN "started_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_activity" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_activity" ALTER COLUMN "last_accessed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_activity" ALTER COLUMN "metadata" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "study_presence" ALTER COLUMN "last_pulse" DROP DEFAULT;--> statement-breakpoint
-- Migrate existing profiles to the new users table to preserve foreign key integrity
INSERT INTO "users" ("id", "email", "role", "status", "full_name", "username", "avatar_url", "bio", "learning_goal", "current_streak", "longest_streak", "total_study_seconds", "last_login_date", "is_verified", "created_at", "updated_at")
SELECT "id", "email", "role", "status", "full_name", "username", "avatar_url", "bio", "learning_goal", "current_streak", "longest_streak", "total_study_seconds", "last_login_date", "is_verified", "created_at", "updated_at"
FROM "profiles"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_exams" ADD CONSTRAINT "theory_exams_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_sub_questions" ADD CONSTRAINT "theory_sub_questions_question_id_theory_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."theory_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_theory_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."theory_exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_questions" ADD CONSTRAINT "theory_questions_exam_id_theory_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."theory_exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_attempts" ADD CONSTRAINT "theory_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theory_attempts" ADD CONSTRAINT "theory_attempts_exam_id_theory_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."theory_exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_presence" ADD CONSTRAINT "study_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_presence" ADD CONSTRAINT "study_presence_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP POLICY "Users can manage their own bookmarks" ON "bookmarks" CASCADE;--> statement-breakpoint
DROP POLICY "Allow public read access for courses" ON "courses" CASCADE;--> statement-breakpoint
DROP POLICY "Users can update their own discussions" ON "discussions" CASCADE;--> statement-breakpoint
DROP POLICY "Users can create discussions" ON "discussions" CASCADE;--> statement-breakpoint
DROP POLICY "Discussions are readable by everyone" ON "discussions" CASCADE;--> statement-breakpoint
DROP POLICY "Users can read own profile" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "Public profiles are readable by everyone" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can update all profiles" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can read all profiles" ON "profiles" CASCADE;--> statement-breakpoint
DROP POLICY "Allow public read access for resources" ON "resources" CASCADE;--> statement-breakpoint
DROP POLICY "Users can read own activity" ON "user_activity" CASCADE;--> statement-breakpoint
DROP POLICY "Users can insert own activity" ON "user_activity" CASCADE;--> statement-breakpoint
DROP POLICY "Admins can read all activity" ON "user_activity" CASCADE;--> statement-breakpoint
DROP POLICY "Users can manage their own presence" ON "study_presence" CASCADE;--> statement-breakpoint
DROP POLICY "Presence is readable by everyone" ON "study_presence" CASCADE;