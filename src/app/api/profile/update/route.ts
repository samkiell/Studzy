import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updatePayload: Record<string, any> = {
      updated_at: new Date(),
    };

    if (body.fullName !== undefined) {
      updatePayload.full_name = body.fullName?.trim() || null;
    }
    if (body.username !== undefined) {
      const username = body.username?.trim()?.toLowerCase();
      if (!username || !/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        return NextResponse.json(
          { error: "Username must be 3-15 characters, alphanumeric/underscores only." },
          { status: 400 }
        );
      }
      updatePayload.username = username;
    }
    if (body.bio !== undefined) {
      updatePayload.bio = body.bio;
    }
    if (body.learningGoal !== undefined) {
      updatePayload.learning_goal = body.learningGoal;
    }
    if (body.password !== undefined) {
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
      const password_hash = await bcrypt.hash(password, 10);
      updatePayload.password_hash = password_hash;
    }

    try {
      await db.update(users).set(updatePayload).where(eq(users.id, user.id));
    } catch (err: any) {
      if (err.code === "23505") {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 400 }
        );
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
