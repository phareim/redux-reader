<script lang="ts">
	import ArticleCard from '$lib/components/ArticleCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Saved - Redux Reader</title>
</svelte:head>

<div class="page-saved">
	<h2>Saved Articles</h2>
	<div class="article-list">
		{#each data.articles as article (article.id)}
			<ArticleCard {article} />
		{:else}
			<p class="empty">No saved articles yet. Save articles while reading to find them here.</p>
		{/each}
	</div>
</div>

<style>
	.page-saved {
		padding: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--color-text-secondary);
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
