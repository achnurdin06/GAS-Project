# import/

Import workbook Excel master → DB (FR-IMP-01..04) memakai **ExcelJS** (`npm i exceljs`).

Pemetaan sheet → tabel: lihat `docs/PRD.md` §11. Kolom formula Excel **tidak** diimpor; hitung ulang lewat engine.

Alur: `parse(file)` → `validate(rows)` (ID unik, induk valid, bobot = 100%, nilai master valid) → preview → `commit()` dalam satu transaksi → tulis `import_logs` → `recalculateProject()` untuk semua project.

Uji rekonsiliasi: hasil engine harus sama dengan nilai Excel (toleransi 0,01%) — PRD §16 butir 4.
