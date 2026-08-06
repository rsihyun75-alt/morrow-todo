CREATE TABLE "todos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "todos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"note" text DEFAULT '새 할 일 · 오늘' NOT NULL,
	"time" text DEFAULT '오늘' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
