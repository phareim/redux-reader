<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Log In - Redux Reader</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card card">
		<h1>Welcome Back</h1>
		<p class="subtitle">Log in to Redux Reader</p>

		{#if form?.error}
			<div class="error-message">{form.error}</div>
		{/if}

		<form method="POST" use:enhance>
			<label>
				<span>Email</span>
				<input type="email" name="email" value={form?.email ?? ''} required autocomplete="email" />
			</label>

			<label>
				<span>Password</span>
				<input type="password" name="password" required autocomplete="current-password" />
			</label>

			<button type="submit" class="btn btn-primary btn-full">Log In</button>
		</form>

		<p class="switch-link">Don't have an account? <a href="/register">Sign up</a></p>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 1rem;
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		padding: 2rem;
	}

	h1 {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	label span {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: 0.875rem;
	}

	input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
		border-color: var(--color-accent);
	}

	.btn-full {
		width: 100%;
		justify-content: center;
		margin-top: 0.5rem;
	}

	.switch-link {
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-top: 1.5rem;
	}
</style>
