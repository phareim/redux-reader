<script lang="ts">
	import ArticleContent from '$lib/components/ArticleContent.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.article.title ?? 'Article'} - Redux Reader</title>
</svelte:head>

<ArticleContent article={data.article} />
