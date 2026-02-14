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
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '';
		}
	}

	function stripHtml(html: string | null): string {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, '').slice(0, 200);
	}
</script>

<a href="/article/{article.id}" class="card article-card" class:unread={!article.is_read}>
	<div class="article-meta">
		{#if !article.is_read}
			<span class="unread-dot"></span>
		{/if}
		{#if article.feed_title}
			<span class="feed-name">{article.feed_title}</span>
		{/if}
		{#if article.published_at}
			<time class="date">{formatDate(article.published_at)}</time>
		{/if}
	</div>
	<h3 class="article-title" style="view-transition-name: article-title-{article.id}">
		{article.title ?? 'Untitled'}
	</h3>
	{#if article.summary}
		<p class="article-summary">{stripHtml(article.summary)}</p>
	{/if}
</a>

<style>
	.article-card {
		display: block;
		color: var(--color-text);
		text-decoration: none;
	}

	.article-card.unread {
		border-left: 3px solid var(--color-unread);
	}

	.article-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.unread-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-unread);
		flex-shrink: 0;
	}

	.feed-name {
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.article-title {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.4;
		margin-bottom: 0.375rem;
	}

	.article-summary {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
