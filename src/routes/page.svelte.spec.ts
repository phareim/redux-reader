import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render heading', async () => {
		render(Page, { props: { data: { articles: [] } } });

		const heading = page.getByRole('heading', { level: 2 });
		await expect.element(heading).toBeInTheDocument();
	});
});
