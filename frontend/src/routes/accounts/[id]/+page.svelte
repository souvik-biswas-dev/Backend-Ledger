<script lang="ts">
	import { auth } from '$lib/auth';
	import { api, ApiError } from '$lib/api';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { formatCurrency, formatDate, truncateId } from '$lib/utils';

	interface LedgerEntry {
		_id: string;
		amount: number;
		type: 'CREDIT' | 'DEBIT';
		transaction: {
			_id: string;
			status: string;
			amount: number;
			createdAt: string;
		};
	}

	interface Account {
		_id: string;
		currency: string;
		status: string;
		balance: number;
		createdAt: string;
	}

	let account: Account | null = $state(null);
	let ledger: LedgerEntry[] = $state([]);
	let loading = $state(true);
	let ledgerPage = $state(1);
	let totalPages = $state(1);
	let statusLoading = $state(false);
	let error = $state('');
	let showDeposit = $state(false);
	let depositAmount = $state('');
	let depositLoading = $state(false);
	let depositError = $state('');

	const id = page.params.id;

	async function loadAccount() {
		try {
			const token = auth.getToken()!;
			const res = await api<{ data: Account }>(`/accounts/${id}`, { token });
			account = res.data;
		} catch {
			goto('/accounts');
		}
	}

	async function loadLedger() {
		try {
			const token = auth.getToken()!;
			const res = await api<{ data: LedgerEntry[]; pagination: { pages: number } }>(
				`/accounts/${id}/ledger?page=${ledgerPage}&limit=15`, { token }
			);
			ledger = res.data;
			totalPages = res.pagination.pages;
		} catch {
			/* ignore */
		}
	}

	onMount(async () => {
		if (!$auth.user) { goto('/login'); return; }
		await Promise.all([loadAccount(), loadLedger()]);
		loading = false;
	});

	async function updateStatus(newStatus: string) {
		statusLoading = true;
		error = '';
		try {
			const token = auth.getToken()!;
			await api(`/accounts/${id}/status`, {
				method: 'PATCH',
				body: { status: newStatus },
				token,
			});
			await loadAccount();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to update status';
		} finally {
			statusLoading = false;
		}
	}

	async function goPage(p: number) {
		ledgerPage = p;
		await loadLedger();
	}

	async function deposit(e: Event) {
		e.preventDefault();
		depositLoading = true;
		depositError = '';
		try {
			const token = auth.getToken()!;
			await api(`/accounts/${id}/deposit`, {
				method: 'POST',
				body: { amount: parseFloat(depositAmount) },
				token,
			});
			showDeposit = false;
			depositAmount = '';
			await Promise.all([loadAccount(), loadLedger()]);
		} catch (err) {
			depositError = err instanceof ApiError ? err.message : 'Deposit failed';
		} finally {
			depositLoading = false;
		}
	}
</script>

{#if loading}
	<div class="loading-page"><div class="spinner spinner-lg"></div></div>
{:else if account}
	<div class="page">
		<div class="page-header">
			<div>
				<a href="/accounts" class="back-link">← Accounts</a>
				<h2 class="page-title"><span class="accent">▍</span> Account Detail</h2>
			</div>
			{#if account.status === 'ACTIVE'}
				<button class="btn btn-primary btn-sm" onclick={() => showDeposit = !showDeposit}>
					{showDeposit ? '✕ Cancel' : '+ Deposit Funds'}
				</button>
			{/if}
		</div>

		{#if showDeposit}
			<div class="card deposit-form">
				<form onsubmit={deposit}>
					<h3 class="form-title">Deposit Funds</h3>
					{#if depositError}
						<div class="alert alert-error">{depositError}</div>
					{/if}
					<div class="form-row">
						<div class="input-group" style="flex:1">
							<label for="deposit-amount">Amount ({account.currency})</label>
							<input
								id="deposit-amount"
								type="number"
								min="0.01"
								step="0.01"
								placeholder="e.g. 1000"
								bind:value={depositAmount}
								required
							/>
						</div>
						<button class="btn btn-primary" type="submit" disabled={depositLoading}>
							{#if depositLoading}<span class="spinner"></span>{/if}
							Deposit
						</button>
					</div>
				</form>
			</div>
		{/if}

		{#if error}
			<div class="alert alert-error">{error}</div>
		{/if}

		<!-- Account Info Card -->
		<div class="card detail-card">
			<div class="detail-grid">
				<div class="stat">
					<span class="stat-label">Balance</span>
					<span class="stat-value">{formatCurrency(account.balance, account.currency)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Currency</span>
					<span class="stat-value" style="font-size:1.1rem">{account.currency}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Status</span>
					<span class="badge badge-{account.status.toLowerCase()}" style="margin-top:4px">{account.status}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Account ID</span>
					<span class="mono-value">{account._id}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Opened</span>
					<span class="mono-value">{formatDate(account.createdAt)}</span>
				</div>
			</div>

			{#if account.status !== 'CLOSED'}
				<div class="status-actions">
					{#if account.status === 'ACTIVE'}
						<button
							class="btn btn-sm"
							onclick={() => updateStatus('FROZEN')}
							disabled={statusLoading}
						>
							Freeze Account
						</button>
					{/if}
					{#if account.status === 'FROZEN'}
						<button
							class="btn btn-primary btn-sm"
							onclick={() => updateStatus('ACTIVE')}
							disabled={statusLoading}
						>
							Unfreeze Account
						</button>
					{/if}
					<button
						class="btn btn-danger btn-sm"
						onclick={() => updateStatus('CLOSED')}
						disabled={statusLoading}
					>
						Close Account
					</button>
				</div>
			{/if}
		</div>

		<!-- Ledger -->
		<div class="section-header">
			<h3 class="section-title">Ledger Entries</h3>
		</div>

		{#if ledger.length === 0}
			<div class="card">
				<div class="empty-state">
					<div class="icon">📒</div>
					<p>No ledger entries yet</p>
				</div>
			</div>
		{:else}
			<div class="card data-grid-wrap">
				<table class="data-grid">
					<thead>
						<tr>
							<th>Type</th>
							<th>Amount</th>
							<th>Transaction</th>
							<th>Date</th>
						</tr>
					</thead>
					<tbody>
						{#each ledger as entry}
							<tr>
								<td>
									<span class="type-pill" class:credit={entry.type === 'CREDIT'} class:debit={entry.type === 'DEBIT'}>
										{entry.type === 'CREDIT' ? '↓' : '↑'} {entry.type}
									</span>
								</td>
								<td class:text-green={entry.type === 'CREDIT'} class:text-red={entry.type === 'DEBIT'}>
									{entry.type === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount, account.currency)}
								</td>
								<td>
									<a href="/transactions/{entry.transaction._id}" class="mono">
										{truncateId(entry.transaction._id)}
									</a>
								</td>
								<td class="mono">{formatDate(entry.transaction.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if totalPages > 1}
				<div class="pagination">
					<button class="btn btn-sm btn-ghost" disabled={ledgerPage <= 1} onclick={() => goPage(ledgerPage - 1)}>← Prev</button>
					<span class="mono" style="font-size:0.8rem; color:var(--clr-text-2)">{ledgerPage} / {totalPages}</span>
					<button class="btn btn-sm btn-ghost" disabled={ledgerPage >= totalPages} onclick={() => goPage(ledgerPage + 1)}>Next →</button>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.back-link {
		font-size: 0.8rem;
		color: var(--clr-muted);
		margin-bottom: 4px;
		display: inline-block;
	}

	.back-link:hover {
		color: var(--clr-accent);
	}

	.detail-card {
		padding: 28px;
		margin-bottom: 32px;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 24px;
		margin-bottom: 20px;
	}

	.mono-value {
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: var(--clr-text-2);
		word-break: break-all;
	}

	.status-actions {
		display: flex;
		gap: 10px;
		padding-top: 16px;
		border-top: 1px solid var(--clr-border-subtle);
		flex-wrap: wrap;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	.section-title {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--clr-text-2);
	}

	.type-pill {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.type-pill.credit {
		color: var(--clr-success);
		background: rgba(78, 201, 160, 0.1);
	}

	.type-pill.debit {
		color: var(--clr-danger);
		background: rgba(224, 82, 82, 0.1);
	}

	.text-green { color: var(--clr-success); }
	.text-red { color: var(--clr-danger); }

	.deposit-form {
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
</style>
