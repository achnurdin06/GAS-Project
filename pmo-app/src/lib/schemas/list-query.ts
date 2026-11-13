import { z } from 'zod';

export const PAGE_SIZES = [10, 25, 50, 100] as const;

const listQuerySchema = z.object({
	page: z.coerce.number().int().min(1).catch(1),
	pageSize: z.coerce
		.number()
		.int()
		.refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
		.catch(25),
	sort: z.string().max(50).optional().catch(undefined),
	dir: z.enum(['asc', 'desc']).catch('asc'),
	q: z.string().max(100).optional().catch(undefined)
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface Paged<T> {
	rows: T[];
	total: number;
	page: number;
	pageSize: number;
}

/** Membaca parameter list (paginasi/sort/cari) dari URL, selalu menghasilkan nilai valid. */
export function parseListQuery(params: URLSearchParams): ListQuery {
	const get = (k: string) => params.get(k) ?? undefined;
	const parsed = listQuerySchema.parse({
		page: get('page'),
		pageSize: get('pageSize'),
		sort: get('sort'),
		dir: get('dir'),
		q: get('q')?.trim() || undefined
	});
	return parsed;
}
