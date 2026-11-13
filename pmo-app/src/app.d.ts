import type { User, Session } from 'better-auth';
import type { Authz } from '#lib/server/rbac/index.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			authz?: Authz;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
