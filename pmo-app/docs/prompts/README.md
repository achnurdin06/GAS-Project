# Template prompt vibe coding

Tips: buka file terkait di editor, lalu kirim prompt. Satu prompt = satu item roadmap. Minta AI **membaca dulu** sebelum menulis.

## 1. Mulai item roadmap

```
Baca AGENTS.md, docs/PRD.md bagian <FR-xxx>, dan docs/roadmap/<file>.md item <F?-?>.
Kerjakan item tersebut saja. Sebelum menulis kode, jelaskan rencana singkat: file yang dibuat/diubah,
permission yang dipakai, dan perubahan skema DB (jika ada). Setelah selesai, jalankan
npm run check, npm run lint, npm run test:unit -- --run dan perbaiki error.
```

## 2. CRUD modul baru

```
Buat CRUD <modul> sesuai PRD <FR-xxx> dan tabel <nama_tabel> di src/lib/server/db/schema/.
- Skema Zod di src/lib/schemas/<modul>.schema.ts
- Service di src/lib/server/services/<modul>.service.ts (transaction + audit + recalc bila perlu)
- Halaman list + form di src/routes/(app)/<route>/ memakai form actions & use:enhance
- requirePermission untuk view/create/update/delete, filter projectScope
- Nilai dropdown dari master_values
- UI Bahasa Indonesia, Tailwind, Svelte 5 runes
```

## 3. Ubah rumus

```
Rumus <nama> harus berubah menjadi <rumus baru>. Ubah HANYA src/lib/server/engine/<file>.ts,
tambahkan/ubah test di engine.spec.ts (test dulu, lalu implementasi), update docs/PRD.md §8.
Jangan menulis rumus di tempat lain.
```

## 4. Debug

```
Error berikut muncul saat <aksi>: <tempel error/log>. Cari akar masalahnya dulu (baca file terkait),
jelaskan penyebabnya, baru perbaiki dengan perubahan sekecil mungkin.
```

## 5. Review sebelum commit

```
Review perubahan di git diff terhadap AGENTS.md: otorisasi server-side, scope project, rumus hanya
di engine, validasi Zod, transaksi & audit, Svelte 5 runes, teks UI Bahasa Indonesia. Daftar temuan saja.
```
