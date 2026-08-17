import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema/cbt";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get("course") || searchParams.get("courseCode");
    const courseId = searchParams.get("courseId");

    if (!courseCode && !courseId) {
      return new NextResponse("Missing course parameter", { status: 400 });
    }

    const whereClause = courseId
      ? eq(questions.course_id, courseId)
      : sql`LOWER(${questions.course_code}) = LOWER(${courseCode!})`;

    const dbQuestions = await db
      .select({
        id: questions.question_id,
        question: questions.question_text,
        options: questions.options,
        answer: questions.correct_option,
        explanation: questions.explanation,
        topic: questions.topic,
        difficulty: questions.difficulty,
        question_type: questions.question_type,
        model_answer: questions.model_answer,
      })
      .from(questions)
      .where(whereClause)
      .orderBy(questions.question_id);

    if (!dbQuestions || dbQuestions.length === 0) {
      return new NextResponse("No questions found for this course", { status: 404 });
    }

    const jsonString = JSON.stringify(dbQuestions, null, 2);
    const filename = `${(courseCode || "questions").toLowerCase()}_question_bank.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("CBT export error:", error);
    return new NextResponse("Failed to export questions", { status: 500 });
  }
}
