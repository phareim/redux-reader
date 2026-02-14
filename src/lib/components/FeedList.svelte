<script lang="ts">
	import type { FeedWithUnreadCount } from '$lib/server/db';

	let { feeds }: { feeds: FeedWithUnreadCount[] } = $props();
</script>

<nav class="feed-list">
	<div class="feed-list-header">
		<h3>Feeds</h3>
	</div>
	{#each feeds as feed}
		<a href="/feed/{feed.id}" class="feed-item">
			<span class="feed-name">{feed.title ?? feed.feed_url}</span>
			{#if feed.unread_count > 0}
				<span class="unread-badge">{feed.unread_count}</span>
			{/if}
		</a>
	{/each}
	{#if feeds.length === 0}
		<p class="empty">No feeds yet. <a href="/feed">Add one.</a></p>
	{/if}
</nav>

<style>
	.feed-list {
		padding: 0 0.5rem;
	}

	.feed-list-header {
		padding: 0.5rem 0.75rem;
	}

	.feed-list-header h3 {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.feed-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		color: var(--color-text);
		font-size: 0.875rem;
		gap: 0.5rem;
	}

	.feed-item:hover {
		background: var(--color-bg);
		color: var(--color-text);
	}

	.feed-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.unread-badge {
		flex-shrink: 0;
		background: var(--color-unread);
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.1rem 0.4rem;
		border-radius: 10px;
		min-width: 1.25rem;
		text-align: center;
	}

	.empty {
		padding: 1rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}
</style>
