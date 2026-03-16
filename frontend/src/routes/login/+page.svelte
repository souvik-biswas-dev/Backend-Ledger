<script lang="ts">
	import { auth } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { ApiError } from '$lib/api';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// Redirect if already logged in
	$effect(() => {
		if ($auth.user) goto('/');
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await auth.login(email, password);
			goto('/');
		} catch (err) {
			if (err instanceof ApiError) {
				error = err.message;
			} else {
				error = 'Something went wrong. Try again.';
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-card">
	<div class="auth-header">
		<span class="auth-icon">◈</span>
		<h1>LEDGER</h1>
		<p class="auth-sub">Sign in to your account</p>
	</div>

	{#if error}
		<div class="alert alert-error">{error}</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<div class="auth-fields">
			<div class="input-group">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					placeholder="you@email.com"
					required
					autocomplete="email"
				/>
			</div>
			<div class="input-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
					autocomplete="current-password"
				/>
			</div>
		</div>

		<button class="btn btn-primary auth-submit" type="submit" disabled={loading}>
			{#if loading}
				<span class="spinner"></span>
			{/if}
			Sign In
		</button>
	</form>

	<p class="auth-alt">
		Don't have an account? <a href="/register">Create one →</a>
	</p>

	<div class="auth-decoration">
		<div class="line"></div>
		<div class="line"></div>
		<div class="line"></div>
	</div>
</div>

<style>
	.auth-card {
		width: 100%;
		max-width: 400px;
		background: var(--clr-surface);
		border: 1px solid var(--clr-border);
		border-radius: var(--radius-lg);
		padding: 40px 32px;
		box-shadow: var(--shadow-elevated);
		position: relative;
		overflow: hidden;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.auth-icon {
		display: block;
		font-size: 2rem;
		color: var(--clr-accent);
		margin-bottom: 12px;
	}

	.auth-header h1 {
		font-family: var(--font-mono);
		font-size: 1.2rem;
		letter-spacing: 0.35em;
		color: var(--clr-text);
		margin-bottom: 8px;
	}

	.auth-sub {
		color: var(--clr-muted);
		font-size: 0.85rem;
	}

	.auth-fields {
		display: flex;
		flex-direction: column;
		gap: 18px;
		margin-bottom: 24px;
	}

	.auth-submit {
		width: 100%;
		justify-content: center;
		padding: 12px;
	}

	.auth-alt {
		text-align: center;
		margin-top: 20px;
		font-size: 0.83rem;
		color: var(--clr-text-2);
	}

	.auth-decoration {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		gap: 3px;
	}

	.auth-decoration .line {
		flex: 1;
		height: 3px;
		background: var(--clr-accent);
		opacity: 0.5;
	}

	.auth-decoration .line:nth-child(2) {
		opacity: 0.3;
	}

	.auth-decoration .line:nth-child(3) {
		opacity: 0.15;
	}
</style>
