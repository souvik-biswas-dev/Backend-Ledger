const BASE = '/api';

interface ApiOptions {
	method?: string;
	body?: unknown;
	token?: string;
}

export class ApiError extends Error {
	status: number;
	data: Record<string, unknown>;

	constructor(status: number, data: Record<string, unknown>) {
		super(data.message as string || 'Request failed');
		this.status = status;
		this.data = data;
	}
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
	const { method = 'GET', body, token } = options;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const res = await fetch(`${BASE}${endpoint}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include',
	});

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new ApiError(res.status, data as Record<string, unknown>);
	}

	return data as T;
}
