<script lang="ts">
	import { auth } from '$lib/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatCurrency, formatDate, truncateId } from '$lib/utils';

	interface Account {
		_id: string;
		currency: string;
		status: string;
		balance: number;
		createdAt: string;
	}

	interface Transaction {
		_id: string;
		fromAccount: { _id: string };
		toAccount: { _id: string };
		amount: number;
		status: string;
		createdAt: string;
	}

	let accounts: Account[] = $state([]);
	let recentTxns: Transaction[] = $state([]);
	let loading = $state(true);

	onMount(async () => {
		if (!$auth.user) {
			goto('/login');
			return;
		}
		try {
			const token = auth.getToken()!;
			const [accRes, txnRes] = await Promise.all([
				api<{ data: Account[] }>('/accounts?limit=50', { token }),
				api<{ data: Transaction[] }>('/transactions?limit=5', { token }),
			]);
			accounts = accRes.data;
			recentTxns = txnRes.data;
		} catch {
			/* will show empty state */
		} finally {
			loading = false;
		}
	});

	let totalBalance = $derived(
		accounts.reduce((sum, a) => sum + (a.status === 'ACTIVE' ? a.balance : 0), 0)
	);
	let activeCount = $derived(accounts.filter(a => a.status === 'ACTIVE').length);
</script>

{#if loading}
	<div class="loading-page"><div class="spinner spinner-lg"></div></div>
{:else}
	<div class="page">
		<div class="page-header">
			<h2 class="page-title">
				<span class="accent">▍</span> Dashboard
			</h2>
			<span class="greeting">Welcome back, {$auth.user?.name?.split(' ')[0]}</span>
		</div>

		<!-- Stats Row -->
		<div class="stats-row">
			<div class="card stat-card">
				<div class="stat">
					<span class="stat-label">Total Balance</span>
					<span class="stat-value">{formatCurrency(totalBalance)}</span>
				</div>
				<div class="stat-accent-bar"></div>
			</div>
			<div class="card stat-card">
				<div class="stat">
					<span class="stat-label">Active Accounts</span>
					<span class="stat-value">{activeCount}</span>
				</div>
			</div>
			<div class="card stat-card">
				<div class="stat">
					<span class="stat-label">Total Accounts</span>
					<span class="stat-value">{accounts.length}</span>
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="quick-actions">
			<a href="/accounts" class="action-tile">
				<span class="action-icon">▣</span>
				<span class="action-label">Accounts</span>
			</a>
			<a href="/transactions/new" class="action-tile">
				<span class="action-icon">↗</span>
				<span class="action-label">New Transfer</span>
			</a>
			<a href="/transactions" class="action-tile">
				<span class="action-icon">⇄</span>
				<span class="action-label">History</span>
			</a>
		</div>

		<!-- Recent Transactions -->
		<div class="section-header">
			<h3 class="section-title">Recent Transactions</h3>
			<a href="/transactions" class="btn btn-ghost btn-sm">View all →</a>
		</div>

		{#if recentTxns.length === 0}
			<div class="card">
				<div class="empty-state">
					<div class="icon">⇄</div>
					<p>No transactions yet</p>
				</div>
			</div>
		{:else}
			<div class="card data-grid-wrap">
				<table class="data-grid">
					<thead>
						<tr>
							<th>ID</th>
							<th>Amount</th>
							<th>Status</th>
							<th>Date</th>
						</tr>
					</thead>
					<tbody>
						{#each recentTxns as txn}
							<tr onclick={() => goto(`/transactions/${txn._id}`)} style="cursor:pointer">
								<td class="mono">{truncateId(txn._id)}</td>
								<td>{formatCurrency(txn.amount)}</td>
								<td>
									<span class="badge badge-{txn.status.toLowerCase()}">{txn.status}</span>
								</td>
								<td class="mono">{formatDate(txn.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

<style>
	.greeting {
		font-size: 0.85rem;
		color: var(--clr-text-2);
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 32px;
	}

	.stat-card {
		padding: 24px;
		position: relative;
	}

	.stat-accent-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--clr-accent), transparent);
	}

	.quick-actions {
		display: flex;
		gap: 12px;
		margin-bottom: 36px;
		flex-wrap: wrap;
	}

	.action-tile {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 22px;
		background: var(--clr-surface);
		border: 1px solid var(--clr-border);
		border-radius: var(--radius-md);
		color: var(--clr-text-2);
		font-size: 0.85rem;
		transition: all var(--transition);
		text-decoration: none;
	}

	.action-tile:hover {
		border-color: var(--clr-accent-dim);
		color: var(--clr-accent);
		background: var(--clr-accent-glow);
	}

	.action-icon {
		font-size: 1.1rem;
	}

	.action-label {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
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
</style>
