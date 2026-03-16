<script lang="ts">
	import { auth } from '$lib/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatCurrency, formatDate, truncateId } from '$lib/utils';

	interface Transaction {
		_id: string;
		fromAccount: { _id: string; currency: string; status: string };
		toAccount: { _id: string; currency: string; status: string };
		amount: number;
		status: string;
		createdAt: string;
	}

	let transactions: Transaction[] = $state([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);

	async function load() {
		try {
			const token = auth.getToken()!;
			const res = await api<{ data: Transaction[]; pagination: { pages: number } }>(
				`/transactions?page=${currentPage}&limit=15`, { token }
			);
			transactions = res.data;
			totalPages = res.pagination.pages;
		} catch {
			/* empty */
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!$auth.user) { goto('/login'); return; }
		load();
	});

	async function goPage(p: number) {
		currentPage = p;
		loading = true;
		await load();
	}
</script>

<div class="page">
	<div class="page-header">
		<h2 class="page-title"><span class="accent">▍</span> Transactions</h2>
		<a href="/transactions/new" class="btn btn-primary btn-sm">+ New Transfer</a>
	</div>

	{#if loading}
		<div class="loading-page"><div class="spinner spinner-lg"></div></div>
	{:else if transactions.length === 0}
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
						<th>From</th>
						<th>To</th>
						<th>Amount</th>
						<th>Status</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{#each transactions as txn}
						<tr onclick={() => goto(`/transactions/${txn._id}`)} style="cursor:pointer">
							<td class="mono">{truncateId(txn._id)}</td>
							<td class="mono">{truncateId(txn.fromAccount._id)}</td>
							<td class="mono">{truncateId(txn.toAccount._id)}</td>
							<td>{formatCurrency(txn.amount, txn.fromAccount.currency)}</td>
							<td>
								<span class="badge badge-{txn.status.toLowerCase()}">{txn.status}</span>
							</td>
							<td class="mono">{formatDate(txn.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if totalPages > 1}
			<div class="pagination">
				<button class="btn btn-sm btn-ghost" disabled={currentPage <= 1} onclick={() => goPage(currentPage - 1)}>← Prev</button>
				<span class="mono" style="font-size:0.8rem; color:var(--clr-text-2)">{currentPage} / {totalPages}</span>
				<button class="btn btn-sm btn-ghost" disabled={currentPage >= totalPages} onclick={() => goPage(currentPage + 1)}>Next →</button>
			</div>
		{/if}
	{/if}
</div>
