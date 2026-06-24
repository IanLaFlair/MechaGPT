"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Markdown from "./Markdown";

type Role = "user" | "assistant";
type Message = { role: Role; content: string; streaming?: boolean };

const SUGGESTIONS = [
  "Halo, kamu model apa?",
  "Jelaskan apa itu LLM lokal",
  "Tulis email izin cuti singkat",
  "Bantu aku debug error Python",
];

export default function ChatScreen({ onLogout }: { onLogout: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [inputFocus, setInputFocus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const busy = isTyping || streaming;
  const canSend = input.trim().length > 0 && !busy;
  const showEmpty = messages.length === 0 && !isTyping;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // auto-resize textarea
    const ta = taRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  }, [input]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setStreaming(false);
  }

  async function logout() {
    abortRef.current?.abort();
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    onLogout();
  }

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if (!text || busy) return;

    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setIsTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        appendAssistant(
          (err as { error?: string })?.error ??
            "Maaf, terjadi kesalahan saat menghubungi model."
        );
        return;
      }

      // Mulai streaming: tambahkan bubble asisten kosong.
      setIsTyping(false);
      setStreaming(true);
      let assistantIndex = -1;
      setMessages((prev) => {
        assistantIndex = prev.length;
        return [...prev, { role: "assistant", content: "", streaming: true }];
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const flush = (chunk: string) => {
        if (!chunk) return;
        setMessages((prev) => {
          const m = [...prev];
          const i = assistantIndex >= 0 ? assistantIndex : m.length - 1;
          if (m[i]) m[i] = { ...m[i], content: m[i].content + chunk };
          return m;
        });
      };

      // Ollama mengirim NDJSON: satu objek JSON per baris.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json = JSON.parse(trimmed);
            const piece: string = json?.message?.content ?? "";
            if (piece) flush(piece);
            if (json?.error) flush(`\n[error: ${json.error}]`);
          } catch {
            /* baris belum lengkap / bukan JSON — abaikan */
          }
        }
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") {
        appendAssistant("Koneksi ke model terputus. Coba lagi.");
      }
    } finally {
      setIsTyping(false);
      setStreaming(false);
      setMessages((prev) =>
        prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
      );
    }
  }

  function appendAssistant(content: string) {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerLogo}>
            <span style={S.headerLogoGlyph}>&#9612;</span>
          </div>
          <span style={S.headerTitle}>Mecha GPT</span>
          <span style={S.modelBadge}>gpt-oss:20b</span>
        </div>
        <div style={S.headerRight}>
          <div style={S.gpuStat}>
            <span style={S.gpuDot}></span>
            RTX 5080 &middot; 16GB
          </div>
          <button onClick={newChat} style={S.newBtn}>
            <span style={S.plus}>+</span> Chat baru
          </button>
          <button onClick={logout} title="Keluar" style={S.logoutBtn}>
            &#9099;
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="msg-scroll" style={S.scroll}>
        <div style={S.thread}>
          {showEmpty && (
            <div style={S.empty}>
              <div style={S.emptyLogo}>
                <span style={S.emptyGlyph}>&#9612;</span>
              </div>
              <div style={S.emptyTitle}>Ada yang bisa kubantu?</div>
              <div style={S.emptyDesc}>
                Model jalan sepenuhnya di GPU lokal &mdash; obrolan kamu nggak
                keluar dari mesin ini.
              </div>
              <div style={S.suggestWrap}>
                {SUGGESTIONS.map((label) => (
                  <button
                    key={label}
                    onClick={() => send(label)}
                    style={S.suggestBtn}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, idx) =>
            m.role === "assistant" ? (
              <div key={idx} style={{ ...S.row, justifyContent: "flex-start" }}>
                <div style={S.asstRow}>
                  <div style={S.asstAvatar}>
                    <span style={S.asstAvatarGlyph}>&#9612;</span>
                  </div>
                  <div style={S.asstText}>
                    <Markdown>{m.content}</Markdown>
                    {m.streaming && <span style={S.caret}></span>}
                  </div>
                </div>
              </div>
            ) : (
              <div key={idx} style={{ ...S.row, justifyContent: "flex-end" }}>
                <div style={S.userBubble}>{m.content}</div>
              </div>
            )
          )}

          {isTyping && (
            <div style={{ ...S.row, justifyContent: "flex-start" }}>
              <div style={S.asstAvatar}>
                <span style={S.asstAvatarGlyph}>&#9612;</span>
              </div>
              <div style={S.dots}>
                <span style={{ ...S.dot, animationDelay: "0s" }}></span>
                <span style={{ ...S.dot, animationDelay: ".15s" }}></span>
                <span style={{ ...S.dot, animationDelay: ".3s" }}></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div style={S.composerWrap}>
        <div style={S.composerInner}>
          <div
            style={{
              ...S.inputBar,
              borderColor: inputFocus ? "#c7caff" : "#e9e9e7",
            }}
          >
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              placeholder="Tanya apa saja&hellip;"
              rows={1}
              style={S.textarea}
            />
            <button
              onClick={() => send()}
              disabled={!canSend}
              style={{
                ...S.sendBtn,
                background: canSend ? "#6366f1" : "#d6d6d2",
                cursor: canSend ? "pointer" : "default",
              }}
            >
              &#8593;
            </button>
          </div>
          <div style={S.composerHint}>
            Enter untuk kirim &middot; Shift+Enter baris baru &middot; jawaban
            bisa keliru, cek info penting.
          </div>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  header: {
    flex: "none",
    height: 60,
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e9e9e7",
    background: "rgba(247,247,246,.85)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex: 5,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 11 },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoGlyph: {
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 15,
    lineHeight: 1,
  },
  headerTitle: { fontSize: 15.5, fontWeight: 700, letterSpacing: "-.01em" },
  modelBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#6366f1",
    background: "#eef0ff",
    padding: "3px 8px",
    borderRadius: 6,
    fontWeight: 500,
  },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  gpuStat: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#8a8a86",
    marginRight: 6,
  },
  gpuDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
    animation: "gpuPulse 2s ease-in-out infinite",
  },
  newBtn: {
    height: 36,
    padding: "0 14px",
    border: "1px solid #e4e4e1",
    borderRadius: 10,
    background: "#fff",
    color: "#1d1d1f",
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "background .15s, border-color .15s",
  },
  plus: { fontSize: 16, lineHeight: 1, color: "#6366f1" },
  logoutBtn: {
    height: 36,
    width: 36,
    border: "1px solid #e4e4e1",
    borderRadius: 10,
    background: "#fff",
    color: "#8a8a86",
    fontFamily: "inherit",
    fontSize: 15,
    cursor: "pointer",
    transition: "background .15s, color .15s",
  },
  scroll: { flex: 1, overflowY: "auto", scrollBehavior: "smooth" },
  thread: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "28px 24px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "56px 0 28px",
    animation: "fadeUp .5s ease both",
  },
  emptyLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e9e9e7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 20px -14px rgba(0,0,0,.25)",
    marginBottom: 20,
  },
  emptyGlyph: {
    color: "#6366f1",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 26,
    lineHeight: 1,
  },
  emptyTitle: { fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" },
  emptyDesc: {
    fontSize: 14,
    color: "#8a8a86",
    marginTop: 8,
    maxWidth: 380,
    lineHeight: 1.5,
  },
  suggestWrap: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 9,
    marginTop: 26,
    maxWidth: 520,
  },
  suggestBtn: {
    padding: "9px 14px",
    border: "1px solid #e4e4e1",
    borderRadius: 11,
    background: "#fff",
    color: "#3a3a38",
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background .15s, border-color .15s, transform .12s",
  },
  row: { display: "flex", gap: 12, animation: "fadeUp .35s ease both" },
  asstRow: { display: "flex", gap: 12, maxWidth: "100%" },
  asstAvatar: {
    flex: "none",
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  asstAvatarGlyph: {
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14,
    lineHeight: 1,
  },
  asstText: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "#26262a",
    wordBreak: "break-word",
    paddingTop: 4,
    minWidth: 0,
  },
  caret: {
    display: "inline-block",
    width: 8,
    height: 17,
    background: "#6366f1",
    borderRadius: 1,
    verticalAlign: "text-bottom",
    marginLeft: 2,
    animation: "blink 1s step-end infinite",
  },
  userBubble: {
    maxWidth: "80%",
    background: "#eef0ff",
    color: "#232544",
    border: "1px solid #e0e3ff",
    borderRadius: "16px 16px 4px 16px",
    padding: "11px 15px",
    fontSize: 15,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  dots: { display: "flex", alignItems: "center", gap: 4, height: 30 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#b9bbf0",
    animation: "dotPulse 1.2s infinite",
  },
  composerWrap: {
    flex: "none",
    padding: "8px 24px 20px",
    background:
      "linear-gradient(to top, #f7f7f6 55%, rgba(247,247,246,0))",
  },
  composerInner: { maxWidth: 760, margin: "0 auto" },
  inputBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    background: "#fff",
    border: "1px solid #e9e9e7",
    borderRadius: 18,
    padding: "8px 8px 8px 16px",
    boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 10px 26px -20px rgba(0,0,0,.2)",
    transition: "border-color .15s",
  },
  textarea: {
    flex: 1,
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    fontSize: 15,
    lineHeight: 1.5,
    color: "#1d1d1f",
    maxHeight: 160,
    padding: "8px 0",
  },
  sendBtn: {
    flex: "none",
    width: 38,
    height: 38,
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background .15s",
    lineHeight: 1,
  },
  composerHint: {
    textAlign: "center",
    fontSize: 11.5,
    color: "#b0b0aa",
    marginTop: 9,
  },
};
