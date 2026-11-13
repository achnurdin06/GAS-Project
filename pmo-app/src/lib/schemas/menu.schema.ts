import { z } from 'zod';

export const menuSchema = z.object({
	parentId: z
		.string()
		.uuid()
		.nullable()
		.optional()
		.transform((v) => v ?? null),
	label: z.string().trim().min(1, 'Label wajib diisi').max(100),
	icon: z
		.string()
		.trim()
		.max(50)
		.transform((v) => v || null)
		.nullable()
		.optional()
		.transform((v) => v ?? null),
	route: z
		.string()
		.trim()
		.max(200)
		.transform((v) => v || null)
		.nullable()
		.optional()
		.transform((v) => v ?? null),
	sortOrder: z.coerce.number().int().min(0).default(0),
	permissionCode: z
		.string()
		.trim()
		.max(60)
		.transform((v) => v || null)
		.nullable()
		.optional()
		.transform((v) => v ?? null),
	isActive: z.coerce.boolean().default(true)
});

export type MenuInput = z.infer<typeof menuSchema>;

export function zodErrors(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const i of error.issues) errors[String(i.path[0] ?? '_')] ??= i.message;
	return errors;
}
