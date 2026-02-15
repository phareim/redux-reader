<script lang="ts">
	let { user }: { user: { id: string; email: string } | null } = $props();
</script>

<header class="header">
	<div class="header-inner">
		<a href="/" class="logo">Redux Reader</a>
		<nav class="nav">
			<a href="/">Home</a>
			<a href="/feed">Feeds</a>
			<a href="/saved">Saved</a>
			{#if user}
				<span class="user-email">{user.email}</span>
				<form method="POST" action="/logout" class="logout-form">
					<button type="submit" class="btn-logout">Log out</button>
				</form>
			{/if}
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

	.user-email {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
	}

	.logout-form {
		display: inline;
	}

	.btn-logout {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0;
	}

	.btn-logout:hover {
		color: var(--color-accent);
	}
</style>
