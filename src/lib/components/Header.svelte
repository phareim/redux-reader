<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<header class="header">
	<div class="header-inner">
		<a href="/" class="logo">Redux Reader</a>
		<nav class="nav">
			<a href="/">Home</a>
			<a href="/feed">Feeds</a>
			<a href="/saved">Saved</a>
		</nav>
	</div>
</header>

<style>
	.header {
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		padding: 0 1.5rem;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.logo {
		font-family: var(--font-serif);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.logo:hover {
		color: var(--color-accent);
	}

	.nav {
		display: flex;
		gap: 1.5rem;
	}

	.nav a {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.nav a:hover {
		color: var(--color-accent);
	}
</style>
