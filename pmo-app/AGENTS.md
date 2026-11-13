# AGENTS.md — Aturan untuk AI coding assistant (Copilot, Claude Code, Cursor, dll.)

Baca file ini **sebelum** menulis kode. Spesifikasi lengkap ada di `docs/PRD.md`; urutan kerja ada di `docs/roadmap/`.

## Tentang aplikasi

**PMO Project Control System**: aplikasi web untuk menggantikan workbook Excel PMO. Rantai progress:
Work Item → Task → Milestone → Project → Executive Dashboard. Ada juga modul RAID, Change Request, Budget, Delivery Gate, Weekly Snapshot, Billing Termin, Gantt, Milestone Timeline, dan S-Curve. Ditambah login, user management, role/permission, dan menu dinamis.

## Stack (jangan diganti tanpa persetujuan)

| Lapisan                       | Pakai                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Framework                     | SvelteKit 3 + Svelte 5 (**runes**: `$state`, `$derived`, `$props`, `$effect`) + TypeScript |
| DB                            | PostgreSQL 16 + Drizzle ORM (`src/lib/server/db/`)                                         |
| Auth                          | Better Auth (email + password, session cookie) — `src/lib/server/auth.ts`                  |
| Otorisasi                     | RBAC custom — `src/lib/server/rbac/`                                                       |
| Styling                       | Tailwind CSS 4 (+ `@tailwindcss/forms`)                                                    |
| Test                          | Vitest (unit), Playwright (e2e)                                                            |
| Nanti (install saat fase-nya) | `zod`, `exceljs`, `echarts`, `pg-boss`                                                     |

## Struktur folder

```
docs/                     PRD, roadmap per fase, template prompt, keputusan arsitektur (ADR)
src/
  hooks.server.ts         session Better Auth → locals.user ; RBAC → locals.authz
  lib/
    config/               menu.ts (menu default), permissions.ts (resource/action + role default)
    schemas/              skema Zod (validasi form & service)
    components/           layout/ ui/ tables/ forms/ gantt/ charts/
    server/
      auth.ts             konfigurasi Better Auth
      rbac/               loadAuthz, can(), requirePermission(), projectScope()
      db/
        schema.ts         barrel semua tabel (dibaca drizzle-kit)
        auth.schema.ts    DIHASILKAN Better Auth — JANGAN edit manual
        schema/           access, master, project, control, billing, system
        seed/             data awal (role, permission, menu, master, super admin)
      engine/             RUMUS BISNIS (fungsi murni + test) — sumber kebenaran PRD §8
      services/           logika bisnis + akses DB per domain
      jobs/               pg-boss (snapshot mingguan, recalc malam)
      import/             import/export Excel
  routes/
    (auth)/login          halaman publik
    (app)/...             semua halaman wajib login (guard di (app)/+layout.server.ts)
```

## Aturan wajib

1. **Otorisasi di server.** Setiap `load`/action/endpoint di `(app)` memanggil `requirePermission(locals, '<resource>.<action>', projectId?)`. Menyembunyikan tombol di UI tidak cukup.
2. **Scope project.** Query list memakai `projectScope(locals.authz, 'project.view')`. Hasil `undefined` berarti semua project; `Set` berarti hanya id tersebut.
3. **Route tidak query DB langsung.** Panggil fungsi di `src/lib/server/services/`.
4. **Rumus hanya di `engine/`.** Jangan menulis ulang rumus progress/RAG/health/billing/S-Curve di service atau komponen. Ubah rumus = ubah `engine/*.ts` + `engine.spec.ts` + `docs/PRD.md §8`.
5. **Kolom `calc*` hanya diisi engine** lewat `recalculateProject()`. Jangan pernah dari input form.
6. **Setiap tulis data**: validasi Zod → `db.transaction()` → recalc bila perlu → tulis `audit_logs`.
7. **Bobot & progress** disimpan sebagai fraksi 0–1 (`0.25` = 25%). Uang `numeric(18,2)`. Tanggal bisnis berupa string `YYYY-MM-DD`, zona waktu Asia/Jakarta (`todayJakarta()`).
8. **Skema DB berubah** → edit `src/lib/server/db/schema/*.ts` → `npm run db:generate` (buat migrasi) → commit file migrasi. Saat prototipe lokal boleh `npm run db:push`.
9. **Nilai pilihan** (status, tipe, severity, portfolio) diambil dari `master_values`, bukan di-hardcode di UI. Pengecualian: status yang dipakai logika engine.
10. **Svelte 5 runes saja.** Jangan pakai `export let`, `$:`, `on:click` (pakai `onclick`), atau `<slot>` (pakai snippet `{@render}`).
11. **Bahasa UI: Indonesia.** Format tanggal `dd-MMM-yyyy`, angka `1.234.567`, persen `63,0%`.
12. **Selesai = lolos** `npm run check`, `npm run lint`, `npm run test:unit -- --run`.

## Perintah

```bash
npm run dev            # dev server http://localhost:5173
npm run db:start       # PostgreSQL via Docker
npm run db:push        # sinkron skema (dev)
npm run db:generate    # buat file migrasi
npm run db:migrate     # jalankan migrasi
npm run db:seed        # role, permission, menu, master data, super admin
npm run db:studio      # GUI database
npm run test:engine    # test rumus bisnis
npm run check && npm run lint
```

## Warna & istilah

Navy `#17365D` (header), RAG Green `#C6EFCE/#006100`, Amber `#FFEB9C/#9C5700`, Red `#FFC7CE/#9C0006`.
Istilah: Work Item, Task, Milestone, Termin, BAST, RAG, SPI, Snapshot (lihat Glosarium di PRD).

---

# Svelte MCP (bawaan scaffold)

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
