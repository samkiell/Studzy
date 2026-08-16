import { pgTable, text, timestamp, uuid, customType } from "drizzle-orm/pg-core";

const vectorType = customType<{ data: number[] }>({
  dataType() {
    return 'vector';
  },
  toDriver(value: number[]) {
    return JSON.stringify(value);
  },
});

export const studyMaterialEmbeddings = pgTable("study_material_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  file_path: text("file_path"),
  content: text("content"),
  embedding: vectorType("embedding"),
  course_code: text("course_code"),
  level: text("level"),
  created_at: timestamp("created_at"),
  username: text("username"),
});
