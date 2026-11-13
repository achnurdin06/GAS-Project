import { z } from 'zod';

export const roleSchema = z.object({
	code: z
		.string()
		.trim()
		.min(2, 'Kode minimal 2 karakter')
		.max(40)
		.regex(/^[A-Z0-9_]+$/, 'Kode hanya huruf besar, angka, underscore'),
	name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
	description: z
		.string()
		.trim()
		.max(255)
		.transform((v) => v || null)
		.nullable()
		.optional()
		.transform((v) => v ?? null),
	isActive: z.coerce.boolean().default(true)
});

export const rolePermissionGrantSchema = z.object({
	permissionId: z.uuid(),
	scope: z.enum(['all', 'assigned'])
});

export const setRolePermissionsSchema = z.object({
	grants: z.array(rolePermissionGrantSchema)
});

export type RoleInput = z.infer<typeof roleSchema>;
export type RolePermissionGrant = z.infer<typeof rolePermissionGrantSchema>;

export function zodErrors(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const i of error.issues) errors[String(i.path[0] ?? '_')] ??= i.message;
	return errors;
}
