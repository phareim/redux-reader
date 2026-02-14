export type Feed = {
	id: string;
	title: string | null;
	site_url: string | null;
	feed_url: string;
	description: string | null;
	last_fetched_at: string | null;
	fetch_error: string | null;
	created_at: string;
};

export type Article = {
	id: string;
	feed_id: string;
	guid: string;
	title: string | null;
	url: string | null;
	author: string | null;
	published_at: string | null;
	summary: string | null;
	content_html: string | null;
	is_read: number;
	is_saved: number;
	fetched_at: string;
};

export type Tag = {
	id: string;
	name: string;
	created_at: string;
};
