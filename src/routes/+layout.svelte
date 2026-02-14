<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import FeedList from '$lib/components/FeedList.svelte';

	let { data, children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<title>Redux Reader</title>
</svelte:head>

<Header />
<div class="app-layout">
	<aside class="sidebar">
		<FeedList feeds={data.feeds} />
	</aside>
	<main class="main-content">
		{@render children()}
	</main>
</div>
