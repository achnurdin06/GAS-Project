# ADR-001 — Pilihan stack & autentikasi

- **Status:** Diterima
- **Tanggal:** 13-Nov-2026

## Keputusan

1. **SvelteKit 3 + Svelte 5 + TypeScript** full-stack (SSR, routing, form actions, dan API dalam satu codebase). Adapter `node` untuk deploy di VM/container.
2. **PostgreSQL 16 + Drizzle ORM** dengan migrasi terversi (`drizzle/`).
3. **Better Auth** untuk login/session, menggantikan rencana awal PRD (session custom pola Lucia + Argon2id).
4. **RBAC dibuat sendiri** (tabel `roles`, `permissions`, `role_permissions`, `user_roles`, `project_members`, `menus`) karena kebutuhan scope per project dan menu dinamis.

## Alasan (poin 3)

- Mengurangi kode keamanan yang ditulis sendiri (hashing, session, rotasi token, rate limit). Ini penting karena sebagian kode akan ditulis dengan bantuan AI.
- Session tetap tersimpan di PostgreSQL (tabel `session`) dan bisa dicabut, sesuai FR-AUTH-03/09.
- Mendukung plugin lanjutan bila dibutuhkan: 2FA (FR-AUTH-11), SSO/OIDC (FR-AUTH-10).

## Konsekuensi

- Tabel `user`, `session`, `account`, `verification` dihasilkan otomatis (`npm run auth:schema`) dan **tidak diedit manual**. Atribut tambahan user disimpan di `user_profiles`.
- Sign-up publik dimatikan (`disableSignUp: true`); user dibuat lewat seed atau User Management.
- Hash password memakai scrypt bawaan Better Auth (bukan Argon2id); PRD FR-AUTH-02 sudah disesuaikan.
