# jobs/

Background job memakai **pg-boss** (antrian di PostgreSQL, tanpa Redis) — ditambahkan di Fase 2.

| Job               | Jadwal (Asia/Jakarta)                  | PRD                     |
| ----------------- | -------------------------------------- | ----------------------- |
| `weekly-snapshot` | Jumat 23:59 (`settings.snapshot_cron`) | FR-SNAP-01              |
| `nightly-recalc`  | setiap hari 00:30                      | FR-ENG-03               |
| `mail`            | on-demand                              | FR-AUTH-05, FR-NOTIF-02 |

Install saat dibutuhkan: `npm i pg-boss`
