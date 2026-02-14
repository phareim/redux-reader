<script lang="ts">
	let dialog: HTMLDialogElement;
	let url = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	export function open() {
		url = '';
		errorMsg = '';
		dialog.showModal();
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!url.trim()) return;

		loading = true;
		errorMsg = '';

		try {
			const res = await fetch('/api/feeds', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: url.trim() })
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({ message: 'Failed to add feed' }));
				throw new Error(data.message || `Error ${res.status}`);
			}

			dialog.close();
			window.location.reload();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Failed to add feed';
		} finally {
			loading = false;
		}
	}
</script>

<dialog bind:this={dialog} class="add-feed-dialog">
	<form onsubmit={handleSubmit}>
		<h2>Add Feed</h2>
		<p class="hint">Enter a website URL or feed URL. We'll try to find the feed automatically.</p>

		<input
			type="url"
			bind:value={url}
			placeholder="https://example.com"
			required
			disabled={loading}
		/>

		{#if errorMsg}
			<p class="error">{errorMsg}</p>
		{/if}

		<div class="actions">
			<button type="button" class="btn" onclick={() => dialog.close()} disabled={loading}>
				Cancel
			</button>
			<button type="submit" class="btn btn-primary" disabled={loading}>
				{loading ? 'Adding...' : 'Add Feed'}
			</button>
		</div>
	</form>
</dialog>

<style>
	.add-feed-dialog {
		border: none;
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		max-width: 480px;
		width: 90vw;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
	}

	.add-feed-dialog::backdrop {
		background: rgba(0, 0, 0, 0.4);
	}

	h2 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		font-family: var(--font-sans);
		margin-bottom: 1rem;
	}

	input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
		border-color: transparent;
	}

	.error {
		color: var(--color-unread);
		font-size: 0.8125rem;
		margin-bottom: 1rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
</style>
