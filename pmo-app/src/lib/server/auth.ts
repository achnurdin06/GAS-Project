import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	// Sign-up publik dimatikan: user dibuat oleh admin (User Management) atau seed.
	emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
	session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 30 }, // absolute 12 jam (PRD FR-AUTH-03)
	rateLimit: { enabled: true, window: 60, max: 10 },
	// TODO(produksi): di belakang reverse proxy, set advanced.ipAddress.ipAddressHeaders/trustedProxies
	// agar rate limit & lock akun (FR-AUTH-07) membaca IP klien yang benar.
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
