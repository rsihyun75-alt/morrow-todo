import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const todos = pgTable("morrow_todos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  note: text("note").notNull().default("새 할 일 · 오늘"),
  time: text("time").notNull().default("오늘"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
