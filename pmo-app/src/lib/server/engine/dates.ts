// Utilitas tanggal berbasis "hari" (tanpa jam) — semua tanggal bisnis berupa string ISO 'YYYY-MM-DD'.
const DAY = 86_400_000;

export type ISODate = string; // 'YYYY-MM-DD'

/** Nomor hari sejak epoch (UTC) — aman dari masalah zona waktu/DST. */
export const dayNum = (d: ISODate): number => Math.floor(Date.parse(d + 'T00:00:00Z') / DAY);

export const fromDayNum = (n: number): ISODate => new Date(n * DAY).toISOString().slice(0, 10);

export const addDays = (d: ISODate, n: number): ISODate => fromDayNum(dayNum(d) + n);

/** Selisih hari b − a. */
export const diffDays = (a: ISODate, b: ISODate): number => dayNum(b) - dayNum(a);

/** Senin pada minggu tanggal d (ISO week, Senin = awal minggu). */
export const mondayOf = (d: ISODate): ISODate => {
	const n = dayNum(d);
	const dow = (new Date(n * DAY).getUTCDay() + 6) % 7; // 0 = Senin
	return fromDayNum(n - dow);
};

/** Hari ini menurut zona waktu Asia/Jakarta. */
export const todayJakarta = (now = new Date()): ISODate =>
	new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
