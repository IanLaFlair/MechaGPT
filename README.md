# Mecha GPT

Web chat sederhana untuk **GPT-OSS 20b** lokal (via **Ollama**) di server internal Zando (MSI / RTX 5080). Dibuat sebagai eksperimen sementara: simpel, dijaga satu password tim, jawaban streaming seperti ChatGPT.

UI di-import dari Claude Design (`MECHA Chat.dc.html`) dan diimplementasikan sebagai aplikasi Next.js sesuai PRD.

## Fitur

- 🔒 Gerbang password tim (shared, 1 password via `APP_PASSWORD`)
- 💬 Chat streaming token-per-token dari Ollama (`/api/chat`)
- 🧩 Proxy aman: browser tidak pernah memanggil Ollama langsung — password & Ollama tetap di server
- 🆕 Tombol "Chat baru" (reset state) dan "Keluar"
- 🎨 UI persis desain Mecha GPT (Plus Jakarta Sans + JetBrains Mono)

## Stack

- Next.js (App Router) + TypeScript
- React 19, tanpa database, state cukup `useState`

## Setup

1. Install dependency:
   ```bash
   npm install
   ```
2. Salin env dan ganti password:
   ```bash
   cp .env.local.example .env.local
   # edit .env.local -> ganti APP_PASSWORD dengan password tim yang kuat
   ```
   ```
   APP_PASSWORD=ganti_dengan_password_tim
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=gpt-oss:20b
   ```
3. Pastikan Ollama jalan dan model tersedia:
   ```bash
   ollama list           # cek gpt-oss:20b ada
   ```

## Menjalankan

Development:
```bash
npm run dev          # http://localhost:3000
```

Production (di MSI):
```bash
npm run build
npm run start        # port 3000 (ganti dgn -p 3100 kalau bentrok)
# atau pakai PM2:
# pm2 start npm --name "llm-chat" -- start
```

## Expose via ngrok

```bash
ngrok http 3000
# bagikan URL https://xxxx.ngrok-free.app + password ke tim
```

## Keamanan

- Ollama tetap `127.0.0.1:11434` — tidak diekspos. App jalan di mesin yang sama dan memanggil localhost.
- Tidak ada port baru ke internet; akses publik hanya lewat tunnel ngrok (outbound).
- `/api/chat` menolak request tanpa cookie sesi valid (HTTP 401).
- **Ganti `APP_PASSWORD` dari default sebelum share link.**

## Arsitektur

```
browser → ngrok → Next.js (cek password, proxy) → http://localhost:11434/api/chat → Ollama + gpt-oss:20b
```

| Route            | Fungsi                                              |
|------------------|-----------------------------------------------------|
| `POST /api/login`  | Verifikasi password → set cookie httpOnly sesi    |
| `POST /api/logout` | Hapus cookie sesi                                 |
| `GET  /api/me`     | Cek status login                                  |
| `POST /api/chat`   | Proxy streaming (NDJSON) ke Ollama, butuh sesi    |
