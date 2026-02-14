<script lang="ts">
	import AddFeedDialog from '$lib/components/AddFeedDialog.svelte';

	let { data } = $props();
	let dialog: ReturnType<typeof AddFeedDialog>;

	async function removeFeed(feedId: string) {
		if (!confirm('Remove this feed and all its articles?')) return;
		await fetch(`/api/feeds/${feedId}`, { method: 'DELETE' });
		window.location.reload();
	}

	async function refreshFeed(feedId: string) {
		const res = await fetch(`/api/feeds/${feedId}/refresh`, { method: 'POST' });
		if (res.ok) {
			window.location.reload();
		}
	}
</script>

<div class="page-feeds">
	<div class="page-header">
		<h2>Manage Feeds</h2>
		<button class="btn btn-primary" onclick={() => dialog.open()}>Add Feed</button>
	</div>

	<div class="feed-grid">
		{#each data.feeds as feed (feed.id)}
			<div class="card feed-card">
				<div class="feed-info">
					<h3><a href="/feed/{feed.id}">{feed.title ?? feed.feed_url}</a></h3>
					{#if feed.site_url}
						<p class="site-url">{feed.site_url}</p>
					{/if}
					{#if feed.fetch_error}
						<p class="fetch-error">{feed.fetch_error}</p>
					{/if}
				</div>
				<div class="feed-actions">
					<button class="btn" onclick={() => refreshFeed(feed.id)}>Refresh</button>
					<button class="btn" onclick={() => removeFeed(feed.id)}>Remove</button>
				</div>
			</div>
		{:else}
			<p class="empty">No feeds yet. Click "Add Feed" to subscribe to an RSS feed.</p>
		{/each}
	</div>
</div>

<AddFeedDialog bind:this={dialog} />

<style>
	.page-feeds {
		padding: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.feed-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feed-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.feed-info h3 {
		font-size: 1rem;
		font-weight: 600;
	}

	.site-url {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.fetch-error {
		font-size: 0.8125rem;
		color: var(--color-unread);
		margin-top: 0.25rem;
	}

	.feed-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.empty {
		color: var(--color-text-muted);
		padding: 2rem 0;
		text-align: center;
	}
</style>
