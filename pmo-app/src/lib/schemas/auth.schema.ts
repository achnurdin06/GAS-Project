import { z } from 'zod';

/** FR-AUTH-02: minimal 8 karakter, kombinasi huruf & angka. */
export const passwordPolicy = z
	.string()
	.min(8, 'Password minimal 8 karakter')
	.max(128, 'Password maksimal 128 karakter')
	.regex(/[A-Za-z]/, 'Password harus mengandung huruf')
	.regex(/\d/, 'Password harus mengandung angka');

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
		newPassword: passwordPolicy,
		confirmPassword: z.string()
	})
	.refine((v) => v.newPassword === v.confirmPassword, {
		path: ['confirmPassword'],
		message: 'Konfirmasi password tidak sama'
	})
	.refine((v) => v.newPassword !== v.currentPassword, {
		path: ['newPassword'],
		message: 'Password baru harus berbeda dari password saat ini'
	});
