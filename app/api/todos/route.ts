import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { todos } from "@/db/schema";

export const dynamic = "force-dynamic";

const priorities = new Set(["high", "medium", "low"]);

export async function GET() {
  try {
    const database = getDb();
    const rows = await database.select().from(todos).orderBy(desc(todos.createdAt), desc(todos.id));
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load todos", error);
    return NextResponse.json({ error: "할 일을 불러오지 못했어요." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const database = getDb();
    const body = (await request.json()) as { title?: unknown; priority?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const priority = typeof body.priority === "string" && priorities.has(body.priority) ? body.priority : "medium";

    if (!title) {
      return NextResponse.json({ error: "할 일 제목을 입력해주세요." }, { status: 400 });
    }

    const [created] = await database
      .insert(todos)
      .values({ title, priority: priority as "high" | "medium" | "low" })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create todo", error);
    return NextResponse.json({ error: "할 일을 저장하지 못했어요." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const database = getDb();
    const completedOnly = new URL(request.url).searchParams.get("completed") === "true";

    if (!completedOnly) {
      return NextResponse.json({ error: "삭제 조건이 필요해요." }, { status: 400 });
    }

    await database.delete(todos).where(eq(todos.completed, true));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to clear completed todos", error);
    return NextResponse.json({ error: "완료한 일을 지우지 못했어요." }, { status: 500 });
  }
}
