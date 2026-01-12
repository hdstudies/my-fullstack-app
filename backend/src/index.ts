import { Hono } from "hono";

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// CORS (so your frontend can call your API)
app.options("*", (c) => c.body(null, 204));
app.use("*", async (c, next) => {
  await next();
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type");
});

// Health check
app.get("/api/health", (c) => c.json({ ok: true }));

// List todos
app.get("/api/todos", async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT id, title, done FROM todos ORDER BY id DESC")
    .all();
  return c.json(results);
});

// Create todo
app.post("/api/todos", async (c) => {
  const body = await c.req.json<{ title?: string }>();
  const title = (body.title || "").trim();
  if (!title) return c.json({ error: "title required" }, 400);

  const row = await c.env.DB
    .prepare("INSERT INTO todos (title, done) VALUES (?, 0) RETURNING id, title, done")
    .bind(title)
    .first();

  return c.json(row, 201);
});

export default app;
