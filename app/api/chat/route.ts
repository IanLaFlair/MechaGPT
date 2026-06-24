import { NextRequest } from "next/server";
import { isAuthed } from "@/lib/auth";

export const runtime = "nodejs";
// Streaming butuh respons dinamis penuh — jangan di-cache / pre-render.
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: NextRequest) {
  // 1. Tolak request tanpa sesi valid.
  if (!isAuthed(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Ambil array messages dari frontend.
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) {
      messages = body.messages
        .filter((m: unknown): m is ChatMessage => {
          const x = m as ChatMessage;
          return x && typeof x.content === "string" && typeof x.role === "string";
        })
        .map((m: ChatMessage) => ({ role: m.role, content: m.content }));
    }
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages kosong" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const host = process.env.OLLAMA_HOST ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";

  // 3. Teruskan ke Ollama dengan stream: true.
  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Tidak bisa menghubungi Ollama. Pastikan Ollama jalan di " + host }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const detail = await ollamaRes.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: `Ollama error (${ollamaRes.status})`, detail }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Stream balik NDJSON apa adanya ke browser (tanpa buffering penuh).
  return new Response(ollamaRes.body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
