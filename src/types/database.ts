export type ResourceType = "audio" | "video" | "pdf" | "image";
export type ResourceStatus = "draft" | "published";
export type UserRole = "student" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";
export type ChatMode = "chat" | "image" | "search" | "code";
export type ChatRole = "user" | "assistant";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
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
    };
  };
}
