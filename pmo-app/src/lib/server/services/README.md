# services/

Logika bisnis + akses DB per domain. Route (`+page.server.ts`) **tidak boleh** query DB langsung — panggil service.

Konvensi:

- Satu file per domain: `project.service.ts`, `work-item.service.ts`, `billing.service.ts`, ...
- Setiap fungsi tulis (create/update/delete) **wajib**:
  1. validasi input dengan Zod (skema di `src/lib/schemas/`)
  2. jalan di dalam `db.transaction()`
  3. memanggil `recalculateProject(projectId, tx)` bila menyentuh bobot/status/tanggal
  4. menulis `audit_logs` (before/after)
- Fungsi baca menerima `scope` dari `projectScope(locals.authz, 'project.view')` untuk filter project.

Urutan dibuat (lihat docs/roadmap): `recalc.service.ts` → `project` → `milestone` → `task` → `work-item` → `raid` → ...
