# AppScript Enterprise Framework (AEF) - Panduan Instalasi

Tutorial ini akan memandu Anda bagaimana cara menginstal atau memindahkan (copy) proyek AppScript Enterprise Framework (AEF) ini ke akun Google (Google Apps Script) yang baru.

## Prasyarat
1. **Node.js dan npm** telah terinstal di komputer Anda.
2. Akun Google yang baru sudah disiapkan.
3. Proyek ini (folder `appscript-base`) sudah ada di komputer Anda.

---

## Opsi A: Metode Copy Melalui Dashboard Apps Script (Disarankan jika Anda tidak memakai Clasp)
Jika Anda hanya ingin menyalin proyek ini ke akun lain tanpa harus melakukan push ulang dari komputer, Anda bisa langsung membuat salinannya dari dashboard web Apps Script (seperti pada gambar yang Anda tunjukkan).

**Langkah-langkah:**
1. **Bagikan Akses:** Buka proyek Apps Script asli di akun lama Anda, lalu bagikan (*Share*) proyek tersebut ke alamat email akun Google Anda yang baru sebagai **Editor**.
2. **Login Akun Baru:** Buka [https://script.google.com](https://script.google.com) menggunakan akun Google Anda yang baru.
3. **Buka Proyek:** Cari proyek "AppScript Enterprise Framework" tersebut (biasanya ada di bagian "Dibagikan kepada saya" atau "Semua Project"). Buka proyek tersebut.
4. **Buat Salinan (Make a Copy):** Di dalam editor Apps Script (atau di halaman Overview), klik ikon informasi/titik tiga lalu pilih **Buat Salinan** (*Make a copy*).
5. Salinan proyek baru akan terbuat dan sekarang sepenuhnya milik akun baru Anda.
6. Lanjutkan ke **Langkah 5 (Setup Database Awal)** dan **Langkah 6 (Deploy)** di bawah untuk menjalankan aplikasinya.
   > *Catatan:* Jika Anda ingin melanjutkan *coding* di komputer lokal dengan Clasp, Anda cukup mengambil "Script ID" dari proyek hasil salinan tersebut (ada di Project Settings) dan masukkan ke file `.clasp.json`.

---

## Opsi B: Metode Instalasi Menggunakan Clasp (Lewat Terminal/Command Prompt)
Gunakan metode ini jika Anda ingin mengunggah (*push*) kode langsung dari komputer Anda ke proyek kosong yang baru di akun baru.

### Langkah 1: Aktifkan Google Apps Script API
Sebelum menggunakan command-line tool `clasp`, Anda harus mengizinkan akses ke Apps Script API di akun Google yang baru.
1. Buka browser dan login ke akun Google Anda yang baru.
2. Kunjungi halaman: [https://script.google.com/home/usersettings](https://script.google.com/home/usersettings)
3. Ubah status **Google Apps Script API** menjadi **ON**.

---

## Langkah 2: Instalasi dan Autentikasi Clasp
`clasp` adalah tool resmi dari Google untuk mengembangkan Apps Script secara lokal.
1. Buka terminal (Command Prompt / PowerShell / Terminal).
2. Instal clasp secara global jika belum ada:
   ```bash
   npm install -g @google/clasp
   ```
3. Login ke akun Google Anda yang baru menggunakan clasp:
   ```bash
   clasp login
   ```
   *Perintah ini akan membuka browser. Silakan pilih akun Google Anda yang baru dan berikan izin akses (Allow).*

---

## Langkah 3: Buat Proyek Apps Script Baru
Karena Anda memindahkan proyek ke akun baru, Anda perlu membuat Script ID yang baru.
1. Di terminal, pastikan Anda berada di dalam folder proyek (`appscript-base`).
   ```bash
   cd /path/to/appscript-base
   ```
2. Hapus file `.clasp.json` lama (jika ada) karena file itu masih terhubung ke akun/proyek yang lama:
   ```bash
   rm .clasp.json
   ```
   *(Atau hapus secara manual melalui File Explorer).*
3. Buat proyek Apps Script baru dengan tipe `webapp`:
   ```bash
   clasp create --type webapp --title "AEF - AppScript Framework"
   ```
   *Perintah ini akan secara otomatis membuat file `.clasp.json` baru yang berisi Script ID untuk akun baru Anda.*

---

## Langkah 4: Upload (Push) Kode ke Server
Setelah proyek baru terbuat, saatnya mengunggah seluruh kode (HTML dan GS) ke server Google.
1. Jalankan perintah push:
   ```bash
   clasp push -f
   ```
   *Tunggu hingga semua file berhasil diunggah.*

---

## Langkah 5: Setup Database Awal
Framework ini menggunakan properti script dan sheet (jika ada) sebagai database. Kita perlu menginisialisasi admin dan role pertama kali.
1. Buka proyek Anda di editor web Google Apps Script:
   ```bash
   clasp open
   ```
2. Di editor web, buka file `src/core/SetupDatabase.gs`.
3. Pilih fungsi `AEF_Setup_InitDatabase` pada menu dropdown *Run* (Jalankan) di bagian atas editor, lalu klik tombol **Run** (Jalankan).
4. **Otorisasi Akses:** Anda akan diminta untuk memberikan izin otorisasi.
   - Klik *Review Permissions*.
   - Pilih akun Google Anda.
   - Jika muncul peringatan "Google hasn’t verified this app", klik **Advanced** lalu pilih **Go to AEF - AppScript Framework (unsafe)**.
   - Klik **Allow**.
5. Setelah fungsi selesai berjalan, sistem akan membuat konfigurasi default dan satu akun Super Admin.

---

## Langkah 6: Deploy sebagai Web App
Agar aplikasi bisa diakses melalui URL:
1. Di editor web Google Apps Script, klik tombol biru **Deploy** di pojok kanan atas, lalu pilih **New deployment**.
2. Klik ikon gir (⚙️) di sebelah "Select type", centang **Web app**.
3. Isi kolom konfigurasi:
   - **Description:** `Deployment Pertama`
   - **Execute as:** `Me (email@anda.com)` *(Sangat Penting!)*
   - **Who has access:** `Anyone`
4. Klik tombol **Deploy**.
5. Anda akan mendapatkan URL **Web app**. Copy URL tersebut. Ini adalah link untuk mengakses aplikasi AEF Anda.

## Selesai! 🎉
Aplikasi sekarang sudah berjalan di akun Anda yang baru. Anda bisa login ke URL Web App tersebut menggunakan akun admin yang terbuat saat proses inisialisasi database.
