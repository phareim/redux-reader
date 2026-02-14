<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Tag: {data.tag.name} - Redux Reader</title>
</svelte:head>

<div class="page-tag">
	<h2>Tag: {data.tag.name}</h2>

	{#if data.feeds.length > 0}
		<section class="tagged-feeds">
			<h3>Feeds</h3>
			<div class="feed-chips">
				{#each data.feeds as feed (feed.id)}
					<a href="/feed/{feed.id}" class="feed-chip">{feed.title ?? feed.feed_url}</a>
				{/each}
			</div>
		</section>
	{/if}

	<section class="tagged-articles">
		<h3>Articles</h3>
		<div class="article-list">
			{#each data.articles as article (article.id)}
				<ArticleCard {article} />
			{:else}
				<p class="empty">No articles with this tag.</p>
			{/each}
		</div>
	</section>
</div>

<style>
	.page-tag {
		padding: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.tagged-feeds {
		margin-bottom: 2rem;
	}

	.feed-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.feed-chip {
		padding: 0.25rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 16px;
		font-size: 0.8125rem;
		color: var(--color-text);
	}

	.feed-chip:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.article-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty {
		color: var(--color-text-muted);
		padding: 2rem 0;
		text-align: center;
	}
</style>
