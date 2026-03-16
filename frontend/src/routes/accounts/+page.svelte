<script lang="ts">
	import { auth } from '$lib/auth';
	import { api, ApiError } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatCurrency, truncateId } from '$lib/utils';

	interface Account {
		_id: string;
		currency: string;
		status: string;
		balance: number;
		createdAt: string;
	}

	let accounts: Account[] = $state([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let currency = $state('INR');
	let creating = $state(false);
	let error = $state('');

	async function loadAccounts() {
		try {
			const token = auth.getToken()!;
			const res = await api<{ data: Account[] }>('/accounts?limit=100', { token });
			accounts = res.data;
		} catch {
			/* empty */
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!$auth.user) { goto('/login'); return; }
		loadAccounts();
	});

	async function createAccount(e: Event) {
		e.preventDefault();
		creating = true;
		error = '';
		try {
			const token = auth.getToken()!;
			await api('/accounts', { method: 'POST', body: { currency }, token });
			showCreate = false;
			currency = 'INR';
			loading = true;
			await loadAccounts();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to create account';
		} finally {
			creating = false;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<h2 class="page-title"><span class="accent">▍</span> Accounts</h2>
		<button class="btn btn-primary btn-sm" onclick={() => showCreate = !showCreate}>
			{showCreate ? '✕ Cancel' : '+ New Account'}
		</button>
	</div>

	{#if showCreate}
		<div class="card create-form">
			<form onsubmit={createAccount}>
				<h3 class="form-title">Open New Account</h3>
				{#if error}
					<div class="alert alert-error">{error}</div>
				{/if}
				<div class="form-row">
					<div class="input-group">
						<label for="currency">Currency</label>
						<select id="currency" bind:value={currency}>
							<option value="INR">INR — Indian Rupee</option>
							<option value="USD">USD — US Dollar</option>
							<option value="EUR">EUR — Euro</option>
							<option value="GBP">GBP — British Pound</option>
						</select>
					</div>
					<button class="btn btn-primary" type="submit" disabled={creating}>
						{#if creating}<span class="spinner"></span>{/if}
						Create
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if loading}
		<div class="loading-page"><div class="spinner spinner-lg"></div></div>
	{:else if accounts.length === 0}
		<div class="card">
			<div class="empty-state">
				<div class="icon">▣</div>
				<p>No accounts yet. Create your first one.</p>
			</div>
		</div>
	{:else}
		<div class="accounts-grid">
			{#each accounts as account}
				<a href="/accounts/{account._id}" class="card account-card">
					<div class="account-top">
						<span class="account-currency">{account.currency}</span>
						<span class="badge badge-{account.status.toLowerCase()}">{account.status}</span>
					</div>
					<div class="account-balance">{formatCurrency(account.balance, account.currency)}</div>
					<div class="account-id">{truncateId(account._id)}</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.create-form {
		padding: 24px;
		margin-bottom: 24px;
	}

	.form-title {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--clr-text-2);
		margin-bottom: 16px;
	}

	.form-row {
		display: flex;
		align-items: flex-end;
		gap: 16px;
		flex-wrap: wrap;
	}

	.form-row .input-group {
		flex: 1;
		min-width: 200px;
	}

	.accounts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	.account-card {
		padding: 24px;
		text-decoration: none;
		color: inherit;
		transition: all var(--transition);
		cursor: pointer;
	}

	.account-card:hover {
		border-color: var(--clr-accent-dim);
		transform: translateY(-2px);
		box-shadow: var(--shadow-elevated);
	}

	.account-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.account-currency {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: var(--clr-accent);
		background: var(--clr-accent-glow);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
	}

	.account-balance {
		font-family: var(--font-mono);
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 8px;
	}

	.account-id {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--clr-muted);
	}
</style>
