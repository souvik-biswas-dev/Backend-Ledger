import { writable } from 'svelte/store';
import { api, ApiError } from './api';
import { goto } from '$app/navigation';

export interface User {
	_id: string;
	email: string;
	name: string;
	createdAt?: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		token: null,
		loading: true,
	});

	return {
		subscribe,

		async init() {
			const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
			if (!savedToken) {
				set({ user: null, token: null, loading: false });
				return;
			}
			try {
				const res = await api<{ user: User }>('/auth/me', { token: savedToken });
				set({ user: res.user, token: savedToken, loading: false });
			} catch {
				localStorage.removeItem('token');
				set({ user: null, token: null, loading: false });
			}
		},

		async login(email: string, password: string) {
			const res = await api<{ user: User; token: string }>('/auth/login', {
				method: 'POST',
				body: { email, password },
			});
			localStorage.setItem('token', res.token);
			set({ user: res.user, token: res.token, loading: false });
		},

		async register(name: string, email: string, password: string) {
			const res = await api<{ user: User; token: string }>('/auth/register', {
				method: 'POST',
				body: { name, email, password },
			});
			localStorage.setItem('token', res.token);
			set({ user: res.user, token: res.token, loading: false });
		},

		async logout() {
			try {
				const savedToken = localStorage.getItem('token');
				await api('/auth/logout', { method: 'POST', token: savedToken || undefined });
			} catch { /* ignore */ }
			localStorage.removeItem('token');
			set({ user: null, token: null, loading: false });
			goto('/login');
		},

		getToken(): string | null {
			return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
		}
	};
}

export const auth = createAuthStore();
