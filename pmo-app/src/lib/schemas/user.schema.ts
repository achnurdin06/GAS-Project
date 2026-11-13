import { z } from 'zod';

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Maksimal ${max} karakter`)
		.transform((v) => v || null)
		.nullable()
		.optional()
		.transform((v) => v ?? null);

export const USER_STATUSES = ['Active', 'Inactive'] as const;
export const PROJECT_ROLES = ['PM', 'PIC', 'Sponsor', 'Viewer'] as const;

export const userProfileSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
	email: z
		.email('Format email tidak valid')
		.max(150)
		.transform((v) => v.toLowerCase()),
	username: z
		.string()
		.trim()
		.max(50)
		.regex(/^[a-zA-Z0-9._-]*$/, 'Username hanya huruf, angka, titik, minus, underscore')
		.transform((v) => v || null)
		.nullable()
		.optional()
		.transform((v) => v ?? null),
	title: optionalText(100),
	unit: optionalText(100),
	phone: optionalText(30)
});

export const createUserSchema = userProfileSchema.extend({
	roleIds: z.array(z.uuid()).min(1, 'Pilih minimal satu role')
});

export const updateUserSchema = userProfileSchema.omit({ email: true });

export const projectMemberSchema = z.object({
	projectId: z.uuid('Project tidak valid'),
	projectRole: z.enum(PROJECT_ROLES)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function zodErrors(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const i of error.issues) errors[String(i.path[0] ?? '_')] ??= i.message;
	return errors;
}
