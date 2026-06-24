"use client";

import { memo, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Render konten asisten sebagai Markdown, distyle agar pas dengan
 * desain Mecha GPT (warna #26262a, line-height 1.65). Dipakai untuk
 * bubble asisten — pesan user tetap teks polos.
 */
function Markdown({ children }: { children: string }) {
  return (
    <div className="md" style={wrap}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={p}>{children}</p>,
          strong: ({ children }) => <strong style={strong}>{children}</strong>,
          em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
          ul: ({ children }) => <ul style={ul}>{children}</ul>,
          ol: ({ children }) => <ol style={ol}>{children}</ol>,
          li: ({ children }) => <li style={li}>{children}</li>,
          blockquote: ({ children }) => <blockquote style={quote}>{children}</blockquote>,
          hr: () => <hr style={hr} />,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" style={link}>
              {children}
            </a>
          ),
          h1: ({ children }) => <h3 style={h}>{children}</h3>,
          h2: ({ children }) => <h3 style={h}>{children}</h3>,
          h3: ({ children }) => <h3 style={h}>{children}</h3>,
          h4: ({ children }) => <h3 style={h}>{children}</h3>,
          code: ({ children, className }) => {
            const isBlock = (className ?? "").includes("language-");
            return isBlock ? (
              <code style={codeBlock}>{children}</code>
            ) : (
              <code style={codeInline}>{children}</code>
            );
          },
          pre: ({ children }) => <pre style={pre}>{children}</pre>,
          table: ({ children }) => (
            <div style={{ overflowX: "auto" }}>
              <table style={table}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th style={th}>{children}</th>,
          td: ({ children }) => <td style={td}>{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);

const wrap: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.65,
  color: "#26262a",
  wordBreak: "break-word",
};
const p: CSSProperties = { margin: "0 0 12px" };
const strong: CSSProperties = { fontWeight: 700, color: "#1d1d1f" };
const ul: CSSProperties = { margin: "0 0 12px", paddingLeft: 22 };
const ol: CSSProperties = { margin: "0 0 12px", paddingLeft: 22 };
const li: CSSProperties = { margin: "3px 0" };
const quote: CSSProperties = {
  margin: "0 0 12px",
  padding: "2px 0 2px 14px",
  borderLeft: "3px solid #c7caff",
  color: "#4a4a52",
};
const hr: CSSProperties = {
  border: "none",
  borderTop: "1px solid #e4e4e1",
  margin: "16px 0",
};
const link: CSSProperties = { color: "#6366f1", textDecoration: "underline" };
const h: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 16.5,
  fontWeight: 700,
  letterSpacing: "-.01em",
  color: "#1d1d1f",
};
const codeInline: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  background: "#eef0ff",
  color: "#4346d6",
  padding: "1px 6px",
  borderRadius: 5,
};
const pre: CSSProperties = {
  margin: "0 0 12px",
  padding: 14,
  background: "#1d1d22",
  borderRadius: 12,
  overflowX: "auto",
};
const codeBlock: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.6,
  color: "#e6e6ea",
  background: "transparent",
  padding: 0,
};
const table: CSSProperties = {
  borderCollapse: "collapse",
  margin: "0 0 12px",
  fontSize: 14,
};
const th: CSSProperties = {
  border: "1px solid #e4e4e1",
  padding: "6px 10px",
  background: "#f4f4f2",
  fontWeight: 600,
  textAlign: "left",
};
const td: CSSProperties = { border: "1px solid #e4e4e1", padding: "6px 10px" };
