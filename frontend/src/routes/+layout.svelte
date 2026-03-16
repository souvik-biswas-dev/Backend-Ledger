<script lang="ts">
	import '../app.css';
	import { auth } from '$lib/auth';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { children } = $props();
	let menuOpen = $state(false);

	onMount(() => {
		auth.init();
	});

	function handleLogout() {
		auth.logout();
	}

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '◆' },
		{ href: '/accounts', label: 'Accounts', icon: '▣' },
		{ href: '/transactions', label: 'Transactions', icon: '⇄' },
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Ledger</title>
</svelte:head>

{#if $auth.loading}
	<div class="loading-page">
		<div class="spinner spinner-lg"></div>
	</div>
{:else if $auth.user}
	<div class="app-shell">
		<nav class="sidebar" class:open={menuOpen}>
			<div class="sidebar-brand">
				<div class="brand-mark">
					<span class="brand-icon">◈</span>
					<span class="brand-text">LEDGER</span>
				</div>
				<button class="mobile-toggle" onclick={() => menuOpen = !menuOpen} aria-label="Toggle menu">
					{menuOpen ? '✕' : '☰'}
				</button>
			</div>

			<div class="sidebar-nav">
				{#each navItems as item}
					<a
						href={item.href}
						class="nav-link"
						class:active={isActive(item.href)}
						onclick={() => menuOpen = false}
					>
						<span class="nav-icon">{item.icon}</span>
						<span>{item.label}</span>
					</a>
				{/each}
			</div>

			<div class="sidebar-footer">
				<div class="user-block">
					<div class="user-avatar">{$auth.user.name[0].toUpperCase()}</div>
					<div class="user-info">
						<span class="user-name">{$auth.user.name}</span>
						<span class="user-email">{$auth.user.email}</span>
					</div>
				</div>
				<button class="btn btn-ghost btn-sm" onclick={handleLogout}>Logout →</button>
			</div>
		</nav>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<main class="main-content" onclick={() => menuOpen = false}>
			{@render children()}
		</main>
	</div>
{:else}
	<main class="auth-shell">
		{@render children()}
	</main>
{/if}

<style>
	.app-shell {
		display: flex;
		min-height: 100vh;
		position: relative;
		z-index: 1;
	}

	.sidebar {
		width: 240px;
		background: var(--clr-surface);
		border-right: 1px solid var(--clr-border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		height: 100vh;
		overflow-y: auto;
		z-index: 100;
	}

	.sidebar-brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 20px 16px;
		border-bottom: 1px solid var(--clr-border);
	}

	.brand-mark {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.brand-icon {
		color: var(--clr-accent);
		font-size: 1.3rem;
	}

	.brand-text {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.25em;
		color: var(--clr-text);
	}

	.mobile-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--clr-text);
		font-size: 1.2rem;
		cursor: pointer;
	}

	.sidebar-nav {
		flex: 1;
		padding: 12px 10px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.88rem;
		color: var(--clr-text-2);
		transition: all var(--transition);
		text-decoration: none;
	}

	.nav-link:hover {
		color: var(--clr-text);
		background: var(--clr-surface-2);
	}

	.nav-link.active {
		color: var(--clr-accent);
		background: var(--clr-accent-glow);
	}

	.nav-icon {
		font-size: 1rem;
		width: 20px;
		text-align: center;
	}

	.sidebar-footer {
		padding: 16px;
		border-top: 1px solid var(--clr-border);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.user-block {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--clr-accent-dim);
		color: var(--clr-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 0.85rem;
		flex-shrink: 0;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.user-name {
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-email {
		font-size: 0.7rem;
		color: var(--clr-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.main-content {
		flex: 1;
		min-width: 0;
	}

	.auth-shell {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	@media (max-width: 768px) {
		.sidebar {
			position: fixed;
			left: -260px;
			top: 0;
			transition: left 0.25s ease;
		}

		.sidebar.open {
			left: 0;
		}

		.mobile-toggle {
			display: block;
		}

		.sidebar-brand {
			position: sticky;
			top: 0;
			background: var(--clr-surface);
			z-index: 10;
		}
	}
</style>
