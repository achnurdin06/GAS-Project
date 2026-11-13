import { z } from 'zod';

export const masterValueSchema = z.object({
	categoryCode: z.string().trim().min(1, 'Kategori wajib diisi'),
	value: z.string().trim().min(1, 'Nilai wajib diisi').max(100),
	sortOrder: z.coerce.number().int().min(0).default(0),
	isSystem: z.coerce.boolean().default(false),
	isActive: z.coerce.boolean().default(true)
});

export type MasterValueInput = z.infer<typeof masterValueSchema>;

export function zodErrors(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const i of error.issues) errors[String(i.path[0] ?? '_')] ??= i.message;
	return errors;
}
