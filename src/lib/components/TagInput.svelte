<script lang="ts">
	import type { Tag } from '$lib/types';
	import TagBadge from './TagBadge.svelte';

	let {
		targetType,
		targetId,
		tags = $bindable<Tag[]>([])
	}: {
		targetType: string;
		targetId: string;
		tags?: Tag[];
	} = $props();
	let inputValue = $state('');
	let suggestions = $state<Tag[]>([]);
	let showSuggestions = $state(false);

	async function search(query: string) {
		if (!query.trim()) {
			suggestions = [];
			return;
		}
		const res = await fetch(`/api/tags?q=${encodeURIComponent(query)}`);
		if (res.ok) {
			suggestions = await res.json();
		}
	}

	async function addTag(name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (tags.some((t) => t.name === trimmed)) return;

		const res = await fetch('/api/tags/link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ targetType, targetId, tagName: trimmed })
		});

		if (res.ok) {
			const { tag } = await res.json();
			tags = [...tags, tag];
		}

		inputValue = '';
		suggestions = [];
		showSuggestions = false;
	}

	async function removeTag(tag: Tag) {
		const res = await fetch('/api/tags/link', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ targetType, targetId, tagId: tag.id })
		});

		if (res.ok) {
			tags = tags.filter((t) => t.id !== tag.id);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag(inputValue);
		}
	}

	function handleInput() {
		search(inputValue);
		showSuggestions = true;
	}
</script>

<div class="tag-input-wrapper">
	<div class="current-tags">
		{#each tags as tag (tag.id)}
			<TagBadge {tag} removable onremove={removeTag} />
		{/each}
	</div>
	<div class="input-row">
		<input
			type="text"
			bind:value={inputValue}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => (showSuggestions = true)}
			onblur={() => setTimeout(() => (showSuggestions = false), 200)}
			placeholder="Add tag..."
			class="tag-text-input"
		/>
		{#if showSuggestions && suggestions.length > 0}
			<ul class="suggestions">
				{#each suggestions as suggestion (suggestion.id)}
					<li>
						<button
							type="button"
							onmousedown={(e: MouseEvent) => { e.preventDefault(); addTag(suggestion.name); }}
						>
							{suggestion.name}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.tag-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.current-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.input-row {
		position: relative;
	}

	.tag-text-input {
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-family: var(--font-sans);
	}

	.tag-text-input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
		border-color: transparent;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md);
		list-style: none;
		z-index: 20;
		max-height: 150px;
		overflow-y: auto;
	}

	.suggestions button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.5rem;
		border: none;
		background: none;
		font-size: 0.8125rem;
	}

	.suggestions button:hover {
		background: var(--color-bg);
	}
</style>
