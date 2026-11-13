export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem {
	id: number;
	type: ToastType;
	message: string;
}

let nextId = 1;

class ToastStore {
	items = $state<ToastItem[]>([]);

	push(type: ToastType, message: string, durationMs = 4000) {
		const id = nextId++;
		this.items.push({ id, type, message });
		setTimeout(() => this.dismiss(id), durationMs);
	}
	success = (message: string) => this.push('success', message);
	error = (message: string) => this.push('error', message, 6000);
	info = (message: string) => this.push('info', message);
	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
