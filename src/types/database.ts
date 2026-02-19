export type ResourceType = "audio" | "video" | "pdf" | "image" | "document" | "question_bank";
export type ResourceStatus = "draft" | "published";
export type UserRole = "student" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";
export type ChatMode = "chat" | "image" | "search" | "code";
export type ChatRole = "user" | "assistant" | "system";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null; // case-insensitive (citext)
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
  bio: string | null;
  learning_goal: string | null;
  current_streak: number;
  last_login_date: string | null;
  longest_streak: number;
  total_study_seconds: number;
  is_verified: boolean;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action_type: string;
  resource_id: string | null;
  metadata: any;
  created_at: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  created_at: string;
  is_cbt: boolean;
}

export interface Resource {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  type: ResourceType;
  file_url: string;
  description: string | null;
  featured: boolean;
  view_count: number;
  status: ResourceStatus;
  created_at: string;
}

export interface CourseWithResources extends Course {
  resources: Resource[];
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  is_starred: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  mode: ChatMode;
  image_url: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
          status?: UserStatus;
          last_login?: string | null;
        };
        Update: Partial<Omit<Profile, "id">>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Course, "id">>;
      };
      resources: {
        Row: Resource;
        Insert: Omit<Resource, "id" | "created_at"> & {
          id?: string;
          slug?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Resource, "id">>;
      };
      user_activity: {
        Row: UserActivity;
        Insert: Omit<UserActivity, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<UserActivity, "id">>;
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_id: string;
          created_at?: string;
        };
        Update: Partial<{
          resource_id: string;
        }>;
      };
      discussions: {
        Row: {
          id: string;
          resource_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          content: string;
          updated_at?: string;
        }>;
      };
      study_presence: {
        Row: {
          user_id: string;
          course_id: string;
          last_pulse: string;
        };
        Insert: {
          user_id: string;
          course_id: string;
          last_pulse?: string;
        };
        Update: Partial<{
          last_pulse: string;
        }>;
      };
      study_material_embeddings: {
        Row: {
          id: string;
          file_path: string;
          content: string;
          embedding: string; // vector stored as string/json
          course_code: string | null;
          level: string | null;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_path: string;
          content: string;
          embedding: string;
          course_code?: string | null;
          level?: string | null;
          username?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          file_path: string;
          content: string;
          embedding: string;
          course_code: string | null;
          level: string | null;
          username: string | null;
        }>;
      };
      questions: {
        Row: {
          id: string;
          course_id: string;
          course_code: string; // Required for unique constraint
          question_id: number; // Required for unique constraint
          question_text: string;
          options: Record<string, string>;
          correct_option: string;
          explanation: string | null;
          topic: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          course_code: string;
          question_id: number;
          question_text: string;
          options: Record<string, string>;
          correct_option: string;
          explanation?: string | null;
          topic?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          created_at?: string;
        };
        Update: Partial<{
          course_id: string;
          course_code: string;
          question_id: number;
          question_text: string;
          options: Record<string, string>;
          correct_option: string;
          explanation: string | null;
          topic: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
        }>;
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          course_code: string; // Legacy support or required by DB
          mode: 'study' | 'exam';
          total_questions: number;
          score: number;
          duration_seconds: number;
          time_limit_seconds: number;
          question_ids: string[];
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          course_code: string; // Legacy support or required by DB
          mode: 'study' | 'exam';
          total_questions: number;
          score?: number;
          duration_seconds?: number;
          time_limit_seconds?: number;
          question_ids?: string[];
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          score: number;
          duration_seconds: number;
          completed_at: string | null;
        }>;
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: string;
          is_correct: boolean;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option: string;
          is_correct: boolean;
          duration_seconds?: number;
          created_at?: string;
        };
        Update: Partial<{
          selected_option: string;
          is_correct: boolean;
        }>;
      };
    };
  };
}
