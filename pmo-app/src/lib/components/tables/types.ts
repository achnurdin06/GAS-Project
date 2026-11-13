export interface Column<R> {
	key: string;
	label: string;
	sortable?: boolean;
	align?: 'left' | 'right';
	/** Dipakai bila tidak ada snippet `cell`. */
	value?: (row: R) => string | number | null | undefined;
}
