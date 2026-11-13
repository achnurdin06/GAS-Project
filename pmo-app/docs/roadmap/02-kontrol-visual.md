# Fase 2 — Kontrol & Visual

- [ ] **F2-1 Change Request** (FR-CR-01..02): workflow Draft → Under Review → Approved/Rejected; approve hanya `cr.approve`.
- [ ] **F2-2 Budget Control** (FR-BUD-01..02).
- [ ] **F2-3 Delivery Gate** (FR-GATE-01..03): 5 gate otomatis saat project dibuat; approval; Gate Health (`engine.gateHealth`).
- [ ] **F2-4 Weekly Snapshot** (FR-SNAP-01..03): `npm i pg-boss`; job Jumat 23:59 membuat snapshot beku; PM mengisi narasi; snapshot tertutup read-only.
- [ ] **F2-5 Nightly recalc** (FR-ENG-03): job 00:30 menghitung ulang planned/RAG/health semua project aktif.
- [ ] **F2-6 Project Timeline / Gantt** (FR-GANTT-01..04): komponen SVG di `components/gantt/`; bar planned, isi progress, merah jika overdue, garis hari ini, zoom minggu/bulan.
- [ ] **F2-7 Milestone Timeline** (FR-MTL-01..03): ◆ milestone, ▲ gate, ● billing; kolom Schedule Health.
- [ ] **F2-8 S-Curve** (FR-SC-01..06): `npm i echarts`; data dari `engine.buildScurve`; KPI Planned/Actual/Deviasi/SPI.
