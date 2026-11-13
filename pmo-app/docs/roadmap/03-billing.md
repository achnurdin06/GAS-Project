# Fase 3 — Billing

- [ ] **F3-1 Storage evidence**: aktifkan MinIO di `compose.yaml`, service upload (`attachments`), batas tipe & ukuran ≤ 20 MB.
- [ ] **F3-2 Billing Termin CRUD** (FR-BILL-01): termin per project + tautkan ≥1 milestone project yang sama.
- [ ] **F3-3 Evidence & verifikasi** (FR-BILL-02..03): upload BAST/berita acara per milestone; verifikasi oleh `billing.approve`.
- [ ] **F3-4 Readiness otomatis** (FR-BILL-04): `engine.billingReadiness` dipanggil saat milestone/evidence berubah.
- [ ] **F3-5 Invoice & payment** (FR-BILL-05): field hanya bisa diubah `billing_invoice.update` (Finance).
- [ ] **F3-6 Ringkasan billing** (FR-BILL-07) + kartu di dashboard.
