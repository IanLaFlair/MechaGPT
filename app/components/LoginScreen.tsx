"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw.trim() }),
      });
      if (res.ok) {
        setPw("");
        onSuccess();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.brandCol}>
          <div style={S.logo}>
            <span style={S.logoGlyph}>&#9612;</span>
          </div>
          <div style={S.title}>Mecha GPT</div>
          <div style={S.subtitle}>gpt-oss:20b &middot; lokal di RTX 5080</div>
        </div>

        <form onSubmit={onSubmit} style={S.form}>
          <label style={S.label}>Password tim</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            placeholder="Masukkan password&hellip;"
            autoFocus
            style={{ ...S.input, borderColor: error ? "#e5484d" : "#e4e4e1" }}
          />

          {error && (
            <div style={S.errorRow}>
              <span style={S.errorBadge}>!</span>
              Password salah. Coba lagi.
            </div>
          )}

          <button type="submit" disabled={loading} style={S.submit}>
            {loading ? "Memeriksa&hellip;" : "Masuk"}
          </button>
        </form>

        <div style={S.hint}>
          Akses dijaga password tim &mdash; obrolan diproses lokal di GPU mesin ini.
        </div>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundImage: "radial-gradient(#ececea 1px, transparent 1px)",
    backgroundSize: "22px 22px",
  },
  card: { width: "100%", maxWidth: 392, animation: "fadeUp .5s ease both" },
  brandCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 15,
    background: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px rgba(99,102,241,.32)",
    marginBottom: 18,
  },
  logoGlyph: {
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 26,
    fontWeight: 500,
    lineHeight: 1,
  },
  title: { fontSize: 23, fontWeight: 700, letterSpacing: "-.02em" },
  subtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11.5,
    color: "#8a8a86",
    marginTop: 7,
    letterSpacing: ".01em",
  },
  form: {
    background: "#fff",
    border: "1px solid #e9e9e7",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 12px 28px -16px rgba(0,0,0,.12)",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 9 },
  input: {
    width: "100%",
    height: 46,
    padding: "0 14px",
    borderRadius: 11,
    border: "1px solid #e4e4e1",
    background: "#fbfbfa",
    fontSize: 15,
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
  },
  errorRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginTop: 11,
    color: "#e5484d",
    fontSize: 13,
    fontWeight: 500,
  },
  errorBadge: {
    width: 15,
    height: 15,
    borderRadius: "50%",
    background: "#e5484d",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
  },
  submit: {
    width: "100%",
    height: 46,
    marginTop: 16,
    border: "none",
    borderRadius: 11,
    background: "#6366f1",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background .15s",
  },
  hint: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 12,
    color: "#a3a39e",
    lineHeight: 1.5,
  },
};
