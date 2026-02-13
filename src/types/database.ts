export type ResourceType = "audio" | "video" | "pdf";
export type ResourceStatus = "draft" | "published";
export type UserRole = "user" | "admin";
export type ChatMode = "chat" | "image" | "search" | "code";
export type ChatRole = "user" | "assistant";

export interface Profile {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
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
          created_at?: string;
        };
        Update: Partial<Omit<Resource, "id">>;
      };
    };
  };
}
