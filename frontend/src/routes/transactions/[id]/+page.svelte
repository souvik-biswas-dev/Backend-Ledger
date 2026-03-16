<script lang="ts">
	import { auth } from '$lib/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { formatCurrency, formatDate, truncateId } from '$lib/utils';

	interface Transaction {
		_id: string;
		fromAccount: { _id: string; currency: string; status: string; user: string };
		toAccount: { _id: string; currency: string; status: string; user: string };
		amount: number;
		status: string;
		idempotencyKey: string;
		createdAt: string;
		updatedAt: string;
	}

	let transaction: Transaction | null = $state(null);
	let loading = $state(true);
	let notFound = $state(false);

	const id = page.params.id;

	onMount(async () => {
		if (!$auth.user) { goto('/login'); return; }
		try {
			const token = auth.getToken()!;
			const res = await api<{ data: Transaction }>(`/transactions/${id}`, { token });
			transaction = res.data;
		} catch {
			notFound = true;
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="loading-page"><div class="spinner spinner-lg"></div></div>
{:else if notFound}
	<div class="page">
		<div class="card">
			<div class="empty-state">
				<div class="icon">✕</div>
				<p>Transaction not found or access denied</p>
			</div>
		</div>
	</div>
{:else if transaction}
	<div class="page">
		<div class="page-header">
			<div>
				<a href="/transactions" class="back-link">← Transactions</a>
				<h2 class="page-title"><span class="accent">▍</span> Transaction Detail</h2>
			</div>
			<span class="badge badge-{transaction.status.toLowerCase()}" style="font-size:0.75rem; padding: 5px 14px">
				{transaction.status}
			</span>
		</div>

		<div class="card detail-card">
			<div class="amount-display">
				<span class="amount-label">Amount</span>
				<span class="amount-value">{formatCurrency(transaction.amount, transaction.fromAccount.currency)}</span>
			</div>

			<div class="flow-visual">
				<div class="flow-node">
					<span class="flow-label">From</span>
					<a href="/accounts/{transaction.fromAccount._id}" class="flow-id">
						{truncateId(transaction.fromAccount._id)}
					</a>
					<span class="flow-currency">{transaction.fromAccount.currency}</span>
				</div>
				<div class="flow-arrow">
					<span class="arrow-line"></span>
					<span class="arrow-head">→</span>
					<span class="arrow-line"></span>
				</div>
				<div class="flow-node">
					<span class="flow-label">To</span>
					<a href="/accounts/{transaction.toAccount._id}" class="flow-id">
						{truncateId(transaction.toAccount._id)}
					</a>
					<span class="flow-currency">{transaction.toAccount.currency}</span>
				</div>
			</div>

			<div class="meta-grid">
				<div class="meta-item">
					<span class="meta-label">Transaction ID</span>
					<span class="meta-value">{transaction._id}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Idempotency Key</span>
					<span class="meta-value">{transaction.idempotencyKey}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Created</span>
					<span class="meta-value">{formatDate(transaction.createdAt)}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Updated</span>
					<span class="meta-value">{formatDate(transaction.updatedAt)}</span>
				</div>
			</div>
		</div>
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
		padding: 32px;
	}

	.amount-display {
		text-align: center;
		margin-bottom: 32px;
	}

	.amount-label {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--clr-muted);
		margin-bottom: 6px;
	}

	.amount-value {
		font-family: var(--font-mono);
		font-size: 2rem;
		font-weight: 700;
		color: var(--clr-text);
	}

	/* Flow visualization */
	.flow-visual {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		margin-bottom: 32px;
		padding: 24px;
		background: var(--clr-surface-2);
		border-radius: var(--radius-md);
		border: 1px solid var(--clr-border-subtle);
	}

	.flow-node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 140px;
	}

	.flow-label {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--clr-muted);
	}

	.flow-id {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--clr-accent);
	}

	.flow-currency {
		font-size: 0.72rem;
		color: var(--clr-text-2);
	}

	.flow-arrow {
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--clr-accent);
	}

	.arrow-line {
		width: 24px;
		height: 1px;
		background: var(--clr-accent-dim);
	}

	.arrow-head {
		font-size: 1.2rem;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 20px;
		padding-top: 24px;
		border-top: 1px solid var(--clr-border-subtle);
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.meta-label {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--clr-muted);
	}

	.meta-value {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--clr-text-2);
		word-break: break-all;
	}

	@media (max-width: 600px) {
		.flow-visual {
			flex-direction: column;
		}

		.flow-arrow {
			transform: rotate(90deg);
		}
	}
</style>
