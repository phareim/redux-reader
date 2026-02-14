<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';

	let { data } = $props();
</script>

<div class="page-feed">
	<div class="page-header">
		<h2>{data.feed.title ?? data.feed.feed_url}</h2>
		{#if data.feed.site_url}
			<a href={data.feed.site_url} target="_blank" rel="noopener noreferrer" class="site-link">
				{data.feed.site_url}
			</a>
		{/if}
	</div>

	<div class="article-list">
		{#each data.articles as article (article.id)}
			<ArticleCard {article} />
		{:else}
			<p class="empty">No articles in this feed yet.</p>
		{/each}
	</div>
</div>

<style>
	.page-feed {
		padding: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.site-link {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
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
