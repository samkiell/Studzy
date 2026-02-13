export type ResourceType = "audio" | "video" | "pdf";

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
  created_at: string;
}

export interface CourseWithResources extends Course {
  resources: Resource[];
}

export interface Database {
  public: {
    Tables: {
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
