import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { uploadFile } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Accept only images
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Images only." }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = `avatars/${user.id}-${Date.now()}.${fileExtension}`;

    // Upload to Filebase
    const avatarUrl = await uploadFile({
      key,
      body: buffer,
      contentType: file.type,
      metadata: {
        userId: user.id,
      },
    });

    // Update user profile in Neon via Drizzle
    await db
      .update(users)
      .set({
        avatar_url: avatarUrl,
        image: avatarUrl,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ url: avatarUrl });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
