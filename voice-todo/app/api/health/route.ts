export async function GET() {
  return Response.json({
    ok: true,
    app: "voice-todo",
    message: "Voice Todo API is ready",
  });
}
