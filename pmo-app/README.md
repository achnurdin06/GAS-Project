# PMO Project Control System

Aplikasi web pengganti workbook Excel PMO, dibangun dengan SvelteKit 3, Svelte 5, PostgreSQL 16, Drizzle ORM, dan Better Auth.

- Spesifikasi: [`docs/PRD.md`](docs/PRD.md)
- Aturan coding untuk AI dan developer: [`AGENTS.md`](AGENTS.md)
- Urutan pengerjaan: [`docs/roadmap/`](docs/roadmap/README.md)
- Template prompt vibe coding: [`docs/prompts/`](docs/prompts/README.md)

## Prasyarat

- Node.js 22 LTS atau lebih baru
- Docker Desktop (untuk PostgreSQL), atau PostgreSQL 16 yang terpasang lokal
- VS Code. Pasang ekstensi yang direkomendasikan saat diminta (lihat `.vscode/extensions.json`)

## Mulai (sekali saja)

```bash
npm install                 # .npmrc sudah memakai legacy-peer-deps
cp .env.example .env        # lalu isi BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:start            # PostgreSQL di Docker (port 5432)
npm run db:push             # buat tabel
npm run db:seed             # role, permission, menu, master data, Super Admin
npm run dev                 # http://localhost:5173
```

Login awal: `admin@pmo.local` / `Admin#12345`. Akun dan password ini diatur di `.env` sebelum seed; segera ganti setelah login.

> Jika memakai PostgreSQL lokal (bukan Docker), buat user `pmo` dan database `pmo`, atau sesuaikan `DATABASE_URL` di `.env`.

## Perintah harian

| Perintah                             | Fungsi                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `npm run dev`                        | Dev server                                                    |
| `npm run check`                      | Type-check Svelte + TS                                        |
| `npm run lint` / `npm run format`    | Cek / rapikan kode                                            |
| `npm run test:engine`                | Test rumus bisnis (progress, RAG, health, billing, S-Curve)   |
| `npm run test:unit`                  | Semua unit test (mode watch)                                  |
| `npm run db:studio`                  | GUI database (Drizzle Studio)                                 |
| `npm run db:generate` → `db:migrate` | Buat dan jalankan file migrasi (dipakai setelah skema stabil) |
| `npm run db:reset`                   | Push ulang skema dan seed (khusus dev)                        |
| `npm run auth:schema`                | Regenerasi tabel Better Auth (setelah mengubah `auth.ts`)     |

## Struktur folder

```
.vscode/                 setting editor, ekstensi, MCP Svelte
.github/                 instruksi Copilot (merujuk ke AGENTS.md)
.claude/                 instruksi Claude Code (merujuk ke AGENTS.md) + skill Svelte
AGENTS.md                ATURAN untuk AI coding assistant
compose.yaml             PostgreSQL (+ MinIO, dikomentari)
docs/
  PRD.md                 kebutuhan produk
  roadmap/               checklist per fase (00–04)
  prompts/               template prompt
  decisions/             catatan keputusan arsitektur (ADR)
src/
  hooks.server.ts        session dan RBAC per request
  lib/
    config/              menu.ts, permissions.ts (role default)
    schemas/             validasi Zod
    components/          layout, ui, tables, forms, gantt, charts
    server/
      auth.ts            Better Auth
      rbac/              can(), requirePermission(), projectScope()
      db/schema/         tabel: access, master, project, control, billing, system
      db/seed/           data awal
      engine/            rumus bisnis dan test
      services/          logika bisnis per domain
      jobs/              job terjadwal (pg-boss)
      import/            import/export Excel
  routes/
    (auth)/login         halaman publik
    (app)/…              semua halaman aplikasi (wajib login, dijaga permission)
```
