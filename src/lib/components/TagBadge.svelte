<script lang="ts">
	import type { Tag } from '$lib/types';

	let {
		tag,
		removable = false,
		onremove
	}: {
		tag: Tag;
		removable?: boolean;
		onremove?: (tag: Tag) => void;
	} = $props();
</script>

<span class="tag-badge">
	<a href="/tag/{tag.name}">{tag.name}</a>
	{#if removable && onremove}
		<button class="remove" onclick={() => onremove?.(tag)} aria-label="Remove tag {tag.name}">
			&times;
		</button>
	{/if}
</span>

<style>
	.tag-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.15rem 0.5rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		font-size: 0.75rem;
	}

	.tag-badge a {
		color: var(--color-text-secondary);
	}

	.remove {
		background: none;
		border: none;
		padding: 0;
		font-size: 0.875rem;
		line-height: 1;
		color: var(--color-text-muted);
	}

	.remove:hover {
		color: var(--color-unread);
	}
</style>
