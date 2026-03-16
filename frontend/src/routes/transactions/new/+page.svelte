<script lang="ts">
	import { auth } from '$lib/auth';
	import { api, ApiError } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatCurrency, truncateId, generateIdempotencyKey } from '$lib/utils';

	interface Account {
		_id: string;
		currency: string;
		status: string;
		balance: number;
	}

	let accounts: Account[] = $state([]);
	let fromAccount = $state('');
	let toAccount = $state('');
	let amount = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let success = $state('');

	onMount(async () => {
		if (!$auth.user) { goto('/login'); return; }
		try {
			const token = auth.getToken()!;
			const res = await api<{ data: Account[] }>('/accounts?limit=100', { token });
			accounts = res.data.filter(a => a.status === 'ACTIVE');
		} catch {
			/* empty */
		} finally {
			loading = false;
		}
	});

	let selectedFrom = $derived(accounts.find(a => a._id === fromAccount));

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = '';

		if (fromAccount === toAccount) {
			error = 'Source and destination accounts must be different';
			return;
		}

		submitting = true;
		try {
			const token = auth.getToken()!;
			const res = await api<{ transaction: { _id: string } }>('/transactions', {
				method: 'POST',
				body: {
					fromAccount,
					toAccount,
					amount: parseFloat(amount),
					idempotencyKey: generateIdempotencyKey(),
				},
				token,
			});
			success = 'Transfer completed successfully!';
			setTimeout(() => goto(`/transactions/${res.transaction._id}`), 1200);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.data.errors && Array.isArray(err.data.errors)) {
					error = (err.data.errors as Array<{message: string}>).map(e => e.message).join('. ');
				} else {
					error = err.message;
				}
			} else {
				error = 'Transfer failed. Try again.';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<a href="/transactions" class="back-link">← Transactions</a>
			<h2 class="page-title"><span class="accent">▍</span> New Transfer</h2>
		</div>
	</div>

	{#if loading}
		<div class="loading-page"><div class="spinner spinner-lg"></div></div>
	{:else}
		<div class="transfer-layout">
			<div class="card transfer-card">
				{#if error}
					<div class="alert alert-error">{error}</div>
				{/if}
				{#if success}
					<div class="alert alert-success">{success}</div>
				{/if}

				<form onsubmit={handleSubmit}>
					<div class="form-fields">
						<div class="input-group">
							<label for="from">From Account</label>
							<select id="from" bind:value={fromAccount} required>
								<option value="" disabled>Select source account</option>
								{#each accounts as acc}
									<option value={acc._id}>
										{truncateId(acc._id)} — {acc.currency} ({formatCurrency(acc.balance, acc.currency)})
									</option>
								{/each}
							</select>
						</div>

						<div class="direction-arrow">↓</div>

						<div class="input-group">
							<label for="to">To Account</label>
							<select id="to" bind:value={toAccount} required>
								<option value="" disabled>Select destination account</option>
								{#each accounts.filter(a => a._id !== fromAccount) as acc}
									<option value={acc._id}>
										{truncateId(acc._id)} — {acc.currency}
									</option>
								{/each}
							</select>
							<span class="input-hint">Or paste any valid account ID</span>
						</div>

						<!-- Allow manual ID entry for external accounts -->
						<div class="input-group">
							<label for="toManual">Or Enter Account ID Directly</label>
							<input
								id="toManual"
								type="text"
								placeholder="Paste destination account ID"
								oninput={(e) => toAccount = (e.target as HTMLInputElement).value}
							/>
						</div>

						<div class="input-group">
							<label for="amount">Amount</label>
							<input
								id="amount"
								type="number"
								bind:value={amount}
								placeholder="0.00"
								step="0.01"
								min="0.01"
								required
							/>
							{#if selectedFrom}
								<span class="input-hint">Available: {formatCurrency(selectedFrom.balance, selectedFrom.currency)}</span>
							{/if}
						</div>
					</div>

					<button class="btn btn-primary submit-btn" type="submit" disabled={submitting || !!success}>
						{#if submitting}
							<span class="spinner"></span>
						{/if}
						Confirm Transfer
					</button>
				</form>
			</div>

			<div class="transfer-info">
				<div class="info-block">
					<span class="info-icon">◈</span>
					<h4>Secure Transfer</h4>
					<p>All transactions are atomic and protected by idempotency keys. Failed transfers are automatically rolled back.</p>
				</div>
				<div class="info-block">
					<span class="info-icon">⟐</span>
					<h4>Same Currency Only</h4>
					<p>Both accounts must share the same currency. Cross-currency transfers are not yet supported.</p>
				</div>
			</div>
		</div>
	{/if}
</div>

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

	.transfer-layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 24px;
		align-items: start;
	}

	.transfer-card {
		padding: 32px;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 28px;
	}

	.direction-arrow {
		text-align: center;
		font-size: 1.3rem;
		color: var(--clr-accent);
		padding: 4px 0;
	}

	.input-hint {
		font-size: 0.72rem;
		color: var(--clr-muted);
		margin-top: 2px;
	}

	.submit-btn {
		width: 100%;
		justify-content: center;
		padding: 14px;
		font-size: 0.85rem;
	}

	.transfer-info {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.info-block {
		background: var(--clr-surface);
		border: 1px solid var(--clr-border);
		border-radius: var(--radius-md);
		padding: 20px;
	}

	.info-icon {
		color: var(--clr-accent);
		font-size: 1.1rem;
		display: block;
		margin-bottom: 8px;
	}

	.info-block h4 {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 6px;
	}

	.info-block p {
		font-size: 0.82rem;
		color: var(--clr-text-2);
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.transfer-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
