import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { todos } from "@/db/schema";

type TodoRouteContext = {
  params: Promise<{ id: string }>;
};

async function readId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

export async function PATCH(request: Request, { params }: TodoRouteContext) {
  try {
    const id = await readId(params);
    const body = (await request.json()) as { completed?: unknown };

    if (!id || typeof body.completed !== "boolean") {
      return NextResponse.json({ error: "유효한 할 일 상태가 필요합니다." }, { status: 400 });
    }

    const [updated] = await db
      .update(todos)
      .set({ completed: body.completed })
      .where(eq(todos.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "할 일을 찾지 못했습니다." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update todo", error);
    return NextResponse.json({ error: "할 일 상태를 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: TodoRouteContext) {
  try {
    const id = await readId(params);

    if (!id) {
      return NextResponse.json({ error: "유효한 할 일 ID가 필요합니다." }, { status: 400 });
    }

    const [deleted] = await db.delete(todos).where(eq(todos.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "할 일을 찾지 못했습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete todo", error);
    return NextResponse.json({ error: "할 일을 삭제하지 못했습니다." }, { status: 500 });
  }
}
