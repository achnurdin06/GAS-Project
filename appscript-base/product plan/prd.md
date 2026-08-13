Product Requirement Document (PRD) & AI Development Guide

AppScript Enterprise Framework (AEF)

1. PROJECT CONTEXT & OBJECTIVE

1.1 Project Identity

Nama Framework: AppScript Enterprise Framework (AEF)

Jenis: Reusable Application Framework

Platform: Google Apps Script (.gs)

Database: Google Spreadsheet (Source of Truth)

Frontend: HTML Service + Bootstrap 5 + Vanilla JavaScript

Repository: GitHub

Development Environment: Antigravity + VS Code

Deployment: clasp

1.2 Tujuan Framework

AEF adalah reusable framework yang digunakan sebagai fondasi pengembangan aplikasi berbasis Google Workspace. Framework ini dibuat tidak untuk satu aplikasi bisnis spesifik, melainkan untuk menjadi fondasi serbaguna yang mengutamakan:

Reusable: Dapat digunakan berulang kali untuk proyek berbeda.

Modular: Komponen terisolasi dan dapat diganti tanpa merusak sistem lain.

Maintainable: Mudah dirawat oleh pengembang maupun AI.

Secure: Mematuhi standar keamanan, enkripsi, dan otorisasi.

Configuration Driven: Perilaku sistem dikendalikan via konfigurasi.

Metadata Driven: Navigasi dan rute berbasis data metadata.

AI Friendly: Struktur konsisten yang mudah dipahami oleh AI.

Accelerated Development: Mempercepat siklus pengembangan aplikasi berikutnya.

1.3 Target Developer Persona

AI harus menganggap developer sebagai:

Individual Developer

Application Developer

System Developer

Future Developer / Maintainer

Prinsip Utama: AI wajib menghasilkan kode dan dokumentasi yang dapat dipahami dan dikembangkan lebih lanjut oleh developer manusia maupun iterasi AI berikutnya, bukan sekadar kode yang bisa berjalan (it works).

2. DOCUMENT CONTEXT & HIERARCHY

Sebelum melakukan eksekusi pengembangan, AI wajib memahami hirarki keputusan dokumen berikut:

Project Charter
       ↓
Framework Philosophy
       ↓
Technology Decision Record (TDR)
       ↓
Product Requirement Document (PRD)
       ↓
Software Design Document (SDD)
       ↓
Development Specification
       ↓
Source Code


AI dilarang keras membuat keputusan arsitektur yang bertentangan dengan dokumen di atasnya.

Jika terdapat konflik antar-kebutuhan atau instruksi yang belum jelas, AI wajib mengidentifikasi dan melaporkan konflik tersebut terlebih dahulu sebelum menulis kode.

3. TECHNOLOGY CONSTRAINTS

Mandatory Stack:

Backend: Google Apps Script (.gs)

Database: Google Spreadsheet

Frontend: HTML Service, Bootstrap 5, Vanilla JavaScript

Development Tools: Antigravity, VS Code, clasp

Version Control: Git, GitHub

Prohibited Stack (Dilarang tanpa persetujuan khusus):

MySQL, PostgreSQL, MariaDB

Firebase, Supabase

Node.js / Express backend eksternal

PHP / Laravel backend eksternal

Framework backend/frontend eksternal yang tidak disetujui

4. ARCHITECTURE (LAYERED DESIGN)

AEF menerapkan Layered Architecture secara ketat untuk memisahkan tanggung jawab (Separation of Concerns):

Presentation Layer (UI/HTML)
           ↓
Controller Layer (Request Handling & Route)
           ↓
Service Layer (Business Logic Hub)
           ↓
Repository Layer (Spreadsheet I/O)
           ↓
Google Spreadsheet (Data Store)


4.1 Presentation Layer

Tanggung Jawab: UI, Form, Table, Navigation, User Interaction, Client-side Validation, Displaying Response.

Dilarang: Mengakses Spreadsheet secara langsung, menjalankan business logic, atau mengeksekusi pengecekan permission secara langsung.

4.2 Controller Layer

Tanggung Jawab: Menerima request (doGet/doPost/google.script.run), membaca & memparsing parameter, validasi tipe data dasar, memanggil Service Layer, dan mengembalikan Standard Response JSON.

Dilarang: Mengakses Spreadsheet, memanggil Repository secara langsung, atau menjalankan business logic.

4.3 Service Layer

Tanggung Jawab: Pusat aturan bisnis (Business Rules), validasi bisnis, otorisasi (RBAC), alur proses, memanggil Repository, memicu Audit Event, dan menangani exception/error handling terpusat.

4.4 Repository Layer

Tanggung Jawab: Eksklusif untuk akses I/O ke Google Spreadsheet (Read, Insert, Update, Delete, Find, Filter, Count) dan mapping data mentah array sheet menjadi objek.

Dilarang: Menjalankan business logic atau validasi otorisasi.

5. DATABASE & SHEET STRUCTURE

Google Spreadsheet bertindak sebagai Source of Truth relasional sederhana.

5.1 Sheet Naming Prefix Standard

mst_: Master Data (e.g., mst_user, mst_role, mst_permission, mst_menu)

sys_: System Data (e.g., sys_configuration, sys_session)

trx_: Transaction Data (e.g., trx_order, trx_approval)

log_: Log & Audit Data (e.g., log_audit, log_activity)

6. DATABASE SCHEMA STANDARD

Setiap sheet wajib memiliki struktur standar yang terdokumentasi.

Minimal Kolom Data Master:

id | created_at | created_by | updated_at | updated_by | status

Kolom Tambahan Data Transaksi:

reference_id | transaction_date

Primary Key Standard:

Wajib menggunakan UUID (e.g., 550e8400-e29b-41d4-a716-446655440000).

Penggunaan Row Number sebagai Primary Key DILARANG KERAS.

7. RELATIONSHIPS

Relasi antar-tabel dikelola menggunakan ID/UUID sebagai Foreign Key.

[mst_user] ──(role_id)──> [mst_role]
[mst_menu] ──(permission_code)──> [mst_permission]


8. AUTHENTICATION

Metode: Email + Password.

Flow Autentikasi:
User → Login Form → Auth Controller → Auth Service → User Repository → Validate Password Hash → Create Session → Login Success / Log Audit.

Ketentuan Keamanan:

Password wajib di-hash menggunakan SHA-256 (Utilities.computeDigest).

Password dilarang disimpan dalam bentuk plain text.

Wajib mencatat audit log untuk percobaan login gagal maupun sukses.

9. SESSION MANAGEMENT

Media Storage: PropertiesService atau CacheService.

Lifecycle: Login → Create Session → Validate Session → Active Session → Logout / Timeout → Destroy Session.

Struktur Data Session Minimal: session_id, user_id, created_at, expired_at, status.

Dilarang: Menyimpan password atau hash password di dalam data Session.

10. AUTHORIZATION & ROLE-BASED ACCESS CONTROL (RBAC)

Struktur Hak Akses:

User ──> Role ──> Permission ──> Module Feature


Permissions menjadi penentu dasar kontrol akses terhadap fungsi aplikasi.

Contoh permission: USER_VIEW, USER_CREATE, USER_UPDATE, USER_DELETE, ROLE_VIEW, ROLE_UPDATE.

AI dilarang membuat kode permission baru secara asal tanpa mendaftarkannya pada skema mst_permission.

11. DYNAMIC MENU

Menu navigasi harus bersifat Configuration Driven + Metadata Driven.

User ──> Role ──> Permission ──> Menu Metadata ──> Rendered Sidebar Menu


Dilarang keras melakukan hardcode menu berdasarkan email, nama, atau username tertentu.

Perubahan hak akses pada role harus otomatis mengubah tampilan menu tanpa merubah kode aplikasi.

12. MENU METADATA STRUCTURE

Setiap entri menu pada mst_menu memiliki atribut minimal:

menu_id (UUID)

parent_id (UUID / null untuk root)

menu_code (e.g., MENU_USER_MGMT)

menu_name (Label UI)

route (e.g., /users)

icon (e.g., Unicode / CSS class)

sort_order (Angka urutan)

permission_code (Relasi ke permission)

status (Active / Inactive)

13. CONFIGURATION DRIVEN PRINCIPLES

Prinsip: Configuration Over Hardcode.

Nilai-nilai variabel sistem yang berpotensi berubah wajib disimpan di sys_configuration atau Script Properties, meliputi:

Application Name & Version

Session Timeout & Cache Duration

Password Policy Constraints

Max Login Attempts

Default Pagination Size & Date Format

14. METADATA DRIVEN PRINCIPLES

AI harus mengutamakan pendekatan berbasis data metadata untuk perilaku UI dan sistem:

$$\text{Perubahan Konfigurasi / Metadata} \longrightarrow \text{Perubahan Perilaku Aplikasi (Tanpa Ubah Source Code)}$$

15. DASHBOARD ARCHITECTURE

Dashboard aplikasi bersifat modular dan tidak boleh mengeksekusi logika bisnis berat di Presentation Layer.

Komponen: Widget Stat, Shortcut, Summary Table, Chart (Canvas-based via Chart.js).

Alur Data: Dashboard UI → Dashboard Controller → Dashboard Service → Repository → Spreadsheet.

16. AUDIT TRAIL

Pencatatan Audit Trail hukumnya wajib untuk aktivitas sensitif sistem:

Login, Logout, Failed Login

Create, Update, Delete Data

Password Change, Permission Change, Role Change

Configuration Change, Access Denied, Error Kritis

Atribut Minimum log_audit:

event_id | timestamp | user_id | module | action | reference_id | status | description | old_value | new_value

17. AUDIT EVENT CODE STANDARD

Format penamaan event wajib konsisten: MODULE_ACTION_RESULT

Contoh Standard Code:

AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILED, AUTH_LOGOUT

USER_CREATED, USER_UPDATED, USER_DELETED

ROLE_CREATED, ROLE_UPDATED, ROLE_DELETED

PERMISSION_UPDATED, CONFIG_UPDATED

ACCESS_DENIED, SYSTEM_ERROR

18. LOGGING STANDARDS

Logger teknis digunakan terpisah dari Audit Trail untuk kebutuhan debugging pengembang:

Informasi Minimum: timestamp, level (INFO/WARN/ERROR), module, function, message, reference_id, user_id.

19. ERROR HANDLING STANDARD

Seluruh exceptions backend wajib ditangkap terpusat oleh Standard Error Handler dan mengembalikan objek JSON seragam:

{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "User dengan ID tersebut tidak ditemukan",
  "data": null,
  "errors": ["User ID USR-999 is invalid"],
  "reference_id": "REF-550e8400-e29b-41d4-a716-446655440000"
}


20. ERROR CODE STANDARD

Format penamaan Error Code: MODULE_ACTION_RESULT

Contoh Error Code:

AUTH_LOGIN_FAILED, AUTH_SESSION_EXPIRED

USER_NOT_FOUND, USER_ALREADY_EXISTS

ROLE_NOT_FOUND, PERMISSION_DENIED

VALIDATION_ERROR, SYSTEM_ERROR

21. ROUTE STRATEGY

Route bertindak sebagai identifier navigasi dan eksekusi handler:

Contoh Rute: /login, /dashboard, /users, /users/create, /roles, /audit.

Rute tidak boleh berisi logika bisnis, melainkan hanya pemeta permintaan ke Controller Handler terkait.

22. UI/UX STRUCTURE

Aplikasi mengadopsi struktur tampilan standar 3 Bagian:

┌─────────────────────────────────────────┐
│                 HEADER                  │
├──────────────┬──────────────────────────┤
│              │                          │
│   SIDEBAR    │       MAIN CONTENT       │
│  (Dynamic)   │                          │
│              │                          │
└──────────────┴──────────────────────────┘


23. UI COMPONENT STRATEGY

Seluruh komponen visual wajib bersifat reusable:

Form Controls, Buttons, Modals, Data Tables, Pagination, Alerts, Toasts, Loaders, Stat Cards.

Dilarang: Membuat duplikasi kode UI yang sama di tempat yang berbeda.

24. PERFORMANCE OPTIMIZATION (SPREADSHEET CONSTRAINTS)

Untuk mengatasi keterbatasan kecepatan I/O Google Spreadsheet, AI WAJIB menghindari pola berikut:

❌ DILARANG (Anti-Pattern):

// Membaca Sheet berulang kali di dalam loop
for (let i = 0; i < items.length; i++) {
  let val = sheet.getRange(i, 1).getValue(); 
}


✅ WAJIB (Optimized Pattern):

// Baca sekali ke memory -> Proses -> Tulis sekali (Batch)
let data = sheet.getDataRange().getValues(); // Read once
// ... proses di memori ...
sheet.getRange(1, 1, rows, cols).setValues(updatedData); // Write batch


25. CODING STANDARDS & NAMING CONVENTIONS

Folder: lowercase (e.g., services, repositories)

File Name: PascalCase (e.g., UserService.gs, UserRepository.gs)

Class Name: PascalCase (e.g., UserRepository)

Function / Method: camelCase (e.g., getUserById)

Variable: camelCase (e.g., activeSession)

Constant: UPPER_CASE (e.g., MAX_RETRY_COUNT)

Sheet / Column Name: snake_case (e.g., mst_user, created_at)

26. REUSABLE CODE STRATEGY

Sebelum membuat fungsi baru, AI wajib memeriksa:

Apakah fungsi serupa sudah ada di modul Core / Shared? Jika ada, gunakan kembali.

Jika belum ada dan berpotensi dipakai modul lain, buat sebagai Reusable Utility di Core.

27. DEVELOPMENT FLOW

Setiap proses pengembangan fitur wajib mengikuti alur teratur:

$$\text{Requirement} \rightarrow \text{Task ID} \rightarrow \text{Design} \rightarrow \text{Implement} \rightarrow \text{Test} \rightarrow \text{Review} \rightarrow \text{Doc} \rightarrow \text{Commit}$$

28. TASK IDENTIFICATION

Setiap tugas wajib memiliki Task ID unik (e.g., AEF-AUTH-001, AEF-USER-001, AEF-AUDIT-001).

Atribut Task ID meliputi:

Objective, Scope, Requirements, Affected Modules, Acceptance Criteria, Testing Requirements.

29. AI DEVELOPMENT RULES & PARTNER PERSONA

AI berkedudukan sebagai Development Partner.

Hak AI:

Membantu coding, refactoring, membuat dokumentasi, merancang unit test, melakukan code review, dan optimasi performa.

Larangan AI (Tanpa persetujuan tertulis user):

Mengubah arsitektur dasar.

Mengubah struktur database/sheet.

Mengubah dokumen TDR atau PRD.

Menghapus modul / fungsi keamanan kritis.

30. AI IMPLEMENTATION CHECKLIST

Sebelum menghasilkan kode, AI wajib mengonfirmasi:

[ ] Requirement & Task ID jelas.

[ ] Layer & Module sasaran ditentukan.

[ ] Skema database & kolom yang dibutuhkan diketahui.

[ ] Input, Output, & Permission disesuaikan.

[ ] Standard Error Handling & Audit Logging telah disiapkan.

31. TESTING REQUIREMENTS

Setiap fitur baru wajib lulus pengujian:

Functional Test: Happy path, input tidak valid, input kosong, data duplikat, data tidak ditemukan, unauthorized access.

Security Test: Validasi autentikasi, pengecekan otorisasi RBAC, masa berlaku session, pencegahan script injection.

Regression Test: Memastikan perubahan kode baru tidak merusak fungsionalitas modul lama.

32. DOCUMENTATION MANAGEMENT

Setiap perubahan arsitektur atau bisnis wajib diikuti pembaruan dokumen terkait:

Perubahan Requirement $\rightarrow$ Update PRD

Perubahan Arsitektur $\rightarrow$ Update TDR & SDD

Perubahan Database $\rightarrow$ Update Database Schema Design

Perubahan Kode $\rightarrow$ Clear Git Commit Message

33. GIT & VERSION CONTROL CONVENTIONS

Format Commit Message: type(scope): concise description

Contoh:

feat(auth): add login service with password hashing

fix(session): fix session timeout expiration check

refactor(menu): optimize metadata menu fetching

docs(prd): update audit trail requirements

34. DEFINITION OF DONE (DoD)

Sebuah Task ID dinyatakan DONE apabila:

Kriteria penerimaan (Acceptance Criteria) terpenuhi 100%.

Mengikuti standar arsitektur 5 layer AEF.

Menggunakan Standard Error Handler & Response JSON.

Memicu Audit Log untuk aksi C/U/D/Auth.

Memenuhi pengujian fungsional dan keamanan.

Bebas dari pembacaan Spreadsheet berulang dalam loop.

Kode rapi, terstruktur, dan didokumentasikan dengan baik.

35. AI FINAL CHECKLIST

Sebelum menyerahkan hasil kode ke developer, AI wajib memverifikasi 15 poin berikut:

Apakah requirement terpenuhi?

Apakah arsitektur sesuai SDD?

Apakah TDR tetap dipatuhi?

Apakah tidak ada hardcode yang tidak perlu?

Apakah tidak ada kode duplikat?

Apakah Repository digunakan untuk I/O data Sheet?

Apakah business logic berada di Service Layer?

Apakah permission RBAC diperiksa?

Apakah audit trail dicatat?

Apakah error menggunakan Standard Handler?

Apakah format response JSON seragam?

Apakah kode mudah dipahami manusia?

Apakah kode mudah dipahami AI selanjutnya?

Apakah pengujian sudah disimulasikan?

Apakah dokumentasi sudah diperbarui?

36. GOLDEN RULE FOR AI

AI wajib mematuhi 8 langkah disiplin pengembangan berikut:

UNDERSTAND ──> PLAN ──> CHECK EXISTING CODE ──> DESIGN
   │
   └──> IMPLEMENT ──> TEST ──> REVIEW ──> DOCUMENT


Aturan Emas: Jangan langsung menulis kode sebelum memahami penuh konteks dan arsitektur yang sudah ada.

37. FINAL AI INSTRUCTION

Gunakan dokumen AEF ini sebagai sumber kebenaran konteks utama.

Jika ada instruksi user yang bertentangan dengan arsitektur AEF, AI Wajib:

Mengidentifikasi dan menjelaskan potensi konflik tersebut.

Menjelaskan dampak teknisnya terhadap sistem.

Meminta konfirmasi keputusan sebelum mengeksekusi kode.

Prioritas Utama AI: Consistency, Security, Reusability, Maintainability, Simplicity, & AI Understandability.