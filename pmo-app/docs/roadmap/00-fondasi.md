# Fase 0 — Fondasi

## Sudah tersedia di scaffold ✅

- [x] SvelteKit 3 + Svelte 5 + TS + Tailwind + ESLint + Prettier + Vitest + Playwright
- [x] PostgreSQL via Docker (`compose.yaml`), Drizzle config
- [x] Skema DB lengkap sesuai PRD §9 (`src/lib/server/db/schema/`)
- [x] Better Auth: login email/password, sign-up publik dimatikan, rate limit
- [x] Halaman login, logout, guard `(app)` wajib login
- [x] RBAC: `loadAuthz`, `can`, `requirePermission`, `projectScope`
- [x] Role default (7), permission (resource × action), menu default, master data, settings, Super Admin (`npm run db:seed`)
- [x] Sidebar terfilter permission + halaman placeholder untuk semua menu (sudah dijaga permission)
- [x] Engine rumus (progress roll-up, RAG, health, billing readiness, S-Curve) + 11 unit test

## Sisa Fase 0

- [x] **F0-1 Ganti password wajib** (FR-AUTH-06): setelah login, jika `user_profiles.must_change_password` true, redirect ke `/account/password`; form ganti password via `auth.api.changePassword`.
- [x] **F0-2 Lock akun & audit login** (FR-AUTH-07, FR-AUD-02): catat `login`/`login_failed` ke `audit_logs`; kunci akun (status Locked) setelah 5 kali gagal dalam 15 menit.
- [x] **F0-3 Helper audit**: `src/lib/server/services/audit.service.ts` → `writeAudit(tx, { userId, action, entityType, entityId, before, after, ip })`.
- [x] **F0-4 Komponen UI dasar**: `Badge` (RAG/status), `KpiTile`, `DataTable` (paginasi + sort server-side), `Modal`, `Toast`, `Select` dari master_values.
- [x] **F0-5 User Management** (FR-USER-01..06): list, tambah (pakai Better Auth admin API / insert user+account), edit, nonaktifkan, reset password, assign role, assign project.
- [x] **F0-6 Role & Permission** (FR-ROLE-01..05): CRUD role + matriks checkbox resource × action + scope.
- [x] **F0-7 Menu Management** (FR-MENU-01..05): CRUD menu; sidebar membaca tabel `menus` (cache per role), menggantikan `DEFAULT_MENU`.
- [x] **F0-8 Master Data & Settings** (FR-MD-01..02): CRUD nilai master (tidak bisa hapus yang dipakai), edit settings (threshold RAG, mapping status).
- [x] **F0-9 Audit Trail viewer** (FR-AUD-03).
