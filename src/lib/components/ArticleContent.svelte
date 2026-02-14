<script lang="ts">
	import type { Article } from '$lib/types';

	let {
		article
	}: {
		article: Article & { feed_title: string | null };
	} = $props();

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		try {
			return new Date(dateStr).toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}

	async function toggleSaved() {
		const newState = !article.is_saved;
		await fetch(`/api/articles/${article.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ is_saved: newState })
		});
		article.is_saved = newState ? 1 : 0;
	}
</script>

<article class="article-content">
	<header class="article-header">
		<div class="article-meta">
			{#if article.feed_title}
				<a href="/feed/{article.feed_id}" class="feed-name">{article.feed_title}</a>
			{/if}
			{#if article.published_at}
				<time class="date">{formatDate(article.published_at)}</time>
			{/if}
			{#if article.author}
				<span class="author">by {article.author}</span>
			{/if}
		</div>
		<h1 class="title" style="view-transition-name: article-title-{article.id}">
			{article.title ?? 'Untitled'}
		</h1>
		<div class="actions">
			<button class="btn" onclick={toggleSaved}>
				{article.is_saved ? 'Unsave' : 'Save'}
			</button>
			{#if article.url}
				<a href={article.url} target="_blank" rel="noopener noreferrer" class="btn">
					Original
				</a>
			{/if}
		</div>
	</header>

	<div class="body">
		{#if article.content_html}
			{@html article.content_html}
		{:else if article.summary}
			{@html article.summary}
		{:else}
			<p class="no-content">No content available. <a href={article.url}>View original.</a></p>
		{/if}
	</div>
</article>

<style>
	.article-content {
		max-width: var(--max-content);
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	.article-header {
		margin-bottom: 2rem;
	}

	.article-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.feed-name {
		font-weight: 500;
	}

	.title {
		font-family: var(--font-serif);
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.3;
		margin-bottom: 1rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.body {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--color-text);
	}

	.body :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
		margin: 1.5rem 0;
	}

	.body :global(a) {
		color: var(--color-accent);
	}

	.body :global(blockquote) {
		border-left: 3px solid var(--color-border);
		padding-left: 1rem;
		margin: 1.5rem 0;
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.body :global(pre) {
		background: var(--color-bg);
		padding: 1rem;
		border-radius: var(--radius-md);
		overflow-x: auto;
		font-family: monospace;
		font-size: 0.875rem;
		margin: 1.5rem 0;
	}

	.body :global(p) {
		margin: 1rem 0;
	}

	.body :global(h2),
	.body :global(h3),
	.body :global(h4) {
		font-family: var(--font-sans);
		margin: 2rem 0 0.75rem;
	}

	.no-content {
		color: var(--color-text-muted);
	}
</style>
