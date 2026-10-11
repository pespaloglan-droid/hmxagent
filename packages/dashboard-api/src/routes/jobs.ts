import { Hono } from "hono";
import { type JobQueue, type JobStatus } from "@hmx/core";
export function jobRoutes(queue: JobQueue): Hono {
  const app = new Hono();
  app.get("/", (c) => {
    const status = c.req.query("status");
    if (
      status &&
      !["queued", "running", "done", "failed", "cancelled"].includes(status)
    )
      return c.json({ error: "Geçersiz iş durumu." }, 400);
    return c.json(
      queue.list(status ? { status: status as JobStatus } : undefined),
    );
  });
  app.get("/:id", (c) => {
    const job = queue.get(c.req.param("id"));
    return job ? c.json(job) : c.json({ error: "İş bulunamadı." }, 404);
  });
  app.post("/", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      kind?: string;
      prompt?: string;
      provider?: string;
    } | null;
    if (
      !body ||
      !["image", "video", "audio", "compose"].includes(body.kind ?? "") ||
      typeof body.prompt !== "string" ||
      !body.prompt.trim() ||
      body.prompt.length > 64000 ||
      (body.provider !== undefined &&
        (typeof body.provider !== "string" || !/^[\w-]+$/.test(body.provider)))
    )
      return c.json(
        { error: "kind, prompt ve provider alanları geçersiz." },
        400,
      );
    try {
      return c.json(
        queue.enqueue({
          kind: body.kind as "image" | "video" | "audio" | "compose",
          prompt: body.prompt,
          ...(body.provider ? { provider: body.provider } : {}),
        }),
        202,
      );
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });
  app.post("/:id/cancel", (c) =>
    queue.cancel(c.req.param("id"))
      ? c.json({ ok: true, job: queue.get(c.req.param("id")) })
      : c.json({ error: "İş bulunamadı veya iptal edilemez." }, 409),
  );
  app.post("/:id/retry", (c) => {
    const job = queue.retry(c.req.param("id"));
    return job
      ? c.json({ ok: true, job }, 202)
      : c.json(
          { error: "İş tekrar denenemez; önce çalışan işlem sona ermeli." },
          409,
        );
  });
  return app;
}
