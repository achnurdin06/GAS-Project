# Fase 1 — MVP Core

- [ ] **F1-1 Recalc service**: `services/recalc.service.ts` → `recalculateProject(projectId, tx)` memuat milestone/task/work item/RAID, memanggil `engine.rollupProject`, `plannedProgressLinear`, `ragFromVariance`, `milestoneHealth`, lalu menyimpan semua kolom `calc*`. Tambahkan test integrasi.
- [ ] **F1-2 Project Register** (FR-PRJ-01..02, 05): list + filter + badge RAG; form tambah/edit; ID otomatis `PRJ-###`.
- [ ] **F1-3 Project Detail** (FR-PRJ-03): tab Overview (KPI project) + tab lain sebagai placeholder.
- [ ] **F1-4 Milestone CRUD** (FR-MS-01..03): tab Milestone, validasi tanggal & total bobot, tombol bagi rata bobot.
- [ ] **F1-5 Task CRUD** (FR-TSK-01..03).
- [ ] **F1-6 Work Item CRUD + update status** (FR-WI-01..03, 06): ubah status → set started_at/completed_at → tulis `progress_events` → `recalculateProject`.
- [ ] **F1-7 Validasi aktivasi project**: project tidak bisa Active jika ada level bobot ≠ 100% (pakai `weightsComplete`).
- [ ] **F1-8 My Work Items** (FR-WI-04): daftar work item milik user login, update status massal, PIC hanya bisa mengubah miliknya.
- [ ] **F1-9 RAID Register** (FR-RAID-01, 03).
- [ ] **F1-10 Executive Dashboard** (FR-DASH-01..05): KPI tiles, portfolio summary, RAG donut, daftar perlu perhatian.
- [ ] **F1-11 Import awal Excel** (FR-IMP-01, 03, 04): `npm i exceljs`; parse workbook master → validasi → preview → commit → `recalculateProject` semua.
- [ ] **F1-12 Rekonsiliasi**: script yang membandingkan hasil engine dengan nilai Excel untuk 60 project (PRD §16 butir 4).
