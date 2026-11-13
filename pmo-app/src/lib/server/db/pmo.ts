import { pgSchema } from 'drizzle-orm/pg-core';

// Semua objek DB aplikasi ada di schema Postgres `pmo` (database dipakai bersama aplikasi lain).
export const pmo = pgSchema('pmo');
