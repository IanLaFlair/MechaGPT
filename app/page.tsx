"use client";

import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import ChatScreen from "./components/ChatScreen";

export default function Page() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAuthed(!!d?.authed);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={shell}>
      {authed === null ? null : authed ? (
        <ChatScreen onLogout={() => setAuthed(false)} />
      ) : (
        <LoginScreen onSuccess={() => setAuthed(true)} />
      )}
    </div>
  );
}

const shell: React.CSSProperties = {
  height: "100vh",
  width: "100%",
  background: "#f7f7f6",
  color: "#1d1d1f",
  overflow: "hidden",
  position: "relative",
};
