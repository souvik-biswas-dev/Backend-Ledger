export function formatCurrency(amount: number, currency: string = 'INR'): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
	}).format(amount);
}

export function formatDate(dateStr: string): string {
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: 'short',
	}).format(new Date(dateStr));
}

export function truncateId(id: string): string {
	return id.slice(0, 4) + '···' + id.slice(-4);
}

export function generateIdempotencyKey(): string {
	return crypto.randomUUID();
}

export function getStatusColor(status: string): string {
	switch (status) {
		case 'ACTIVE':
		case 'COMPLETED':
			return 'var(--clr-success)';
		case 'PENDING':
			return 'var(--clr-warning)';
		case 'FROZEN':
			return 'var(--clr-info)';
		case 'FAILED':
		case 'REVERSED':
		case 'CLOSED':
			return 'var(--clr-danger)';
		default:
			return 'var(--clr-muted)';
	}
}
