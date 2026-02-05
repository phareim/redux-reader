const API_BASE = "/api";

const state = {
  feeds: [],
  selectedFeedId: null,
  items: [],
  savedItems: [],
  view: "feed",
  reader: {
    savedId: null,
    html: "",
    version: 0,
    dirty: false,
  },
  tagging: {
    targetType: null,
    targetId: null,
  },
};

const elements = {
  feedList: document.getElementById("feed-list"),
  cards: document.getElementById("cards"),
  cardsTitle: document.getElementById("cards-title"),
  cardsSub: document.getElementById("cards-sub"),
  subscribeForm: document.getElementById("subscribe-form"),
  subscribeInput: document.getElementById("subscribe-input"),
  subscribeMessage: document.getElementById("subscribe-message"),
  refreshFeed: document.getElementById("refresh-feed"),
  savedView: document.getElementById("save-view"),
  navItems: Array.from(document.querySelectorAll(".nav-item")),
  reader: document.getElementById("reader"),
  readerContent: document.getElementById("reader-content"),
  readerTitle: document.getElementById("reader-title"),
  readerSub: document.getElementById("reader-sub"),
  readerSave: document.getElementById("reader-save"),
  readerClose: document.getElementById("reader-close"),
  tagModal: document.getElementById("tag-modal"),
  tagInput: document.getElementById("tag-input"),
  tagSuggestions: document.getElementById("tag-suggestions"),
  tagCancel: document.getElementById("tag-cancel"),
  tagSave: document.getElementById("tag-save"),
};

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

async function apiDelete(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

async function loadFeeds() {
  try {
    const data = await apiGet("/feeds");
    state.feeds = data.feeds ?? [];
    renderFeedList();
    if (!state.selectedFeedId && state.feeds.length > 0 && state.view === "feed") {
      selectFeed(state.feeds[0].id);
    } else if (state.feeds.length === 0 && state.view === "feed") {
      renderEmptyCards();
    }
  } catch {
    renderEmptyCards();
  }
}

async function selectFeed(feedId) {
  state.selectedFeedId = feedId;
  state.view = "feed";
  setNavActive("today");
  const feed = state.feeds.find((f) => f.id === feedId);
  if (feed) {
    elements.cardsTitle.textContent = feed.title || "Feed";
    elements.cardsSub.textContent = feed.feed_url;
  }

  await loadFeedItems(feedId);
  renderFeedList();
}

async function loadFeedItems(feedId) {
  try {
    const data = await apiGet(`/feeds/${feedId}/items`);
    state.items = data.items ?? [];
    renderCards();
  } catch {
    state.items = [];
    renderEmptyCards();
  }
}

async function loadSavedItems() {
  try {
    const data = await apiGet("/saved");
    state.savedItems = data.items ?? [];
    renderSavedCards();
  } catch {
    state.savedItems = [];
    renderEmptyCards("No saved articles yet", "Save stories to build your archive.");
  }
}

function renderFeedList() {
  elements.feedList.innerHTML = "";
  state.feeds.forEach((feed) => {
    const btn = document.createElement("button");
    btn.className = "feed-chip";
    btn.type = "button";
    btn.textContent = feed.title || feed.feed_url;
    if (feed.id === state.selectedFeedId) {
      btn.style.borderColor = "var(--accent)";
    }
    btn.addEventListener("click", () => selectFeed(feed.id));
    elements.feedList.appendChild(btn);
  });
}

function renderCards() {
  elements.cards.innerHTML = "";
  if (state.items.length === 0) {
    renderEmptyCards();
    return;
  }

  state.items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    const isSaved = Boolean(item.saved);
    card.innerHTML = `
      <div class="card-title">${escapeHtml(item.title || "Untitled")}</div>
      <div class="card-meta">${escapeHtml(item.published_at || "")}</div>
      <div class="card-body">${truncate(stripHtml(item.summary || item.content_html || ""), 220)}</div>
      <div class="card-actions">
        <button type="button" ${isSaved ? "disabled" : ""}>${isSaved ? "Saved" : "Save"}</button>
        <button type="button">Tag</button>
        <button type="button">Open</button>
      </div>
    `;
    const [saveButton, tagButton, openButton] = card.querySelectorAll("button");
    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        await saveItem(item, saveButton);
      });
    }
    if (tagButton) {
      tagButton.addEventListener("click", async () => {
        await tagTarget("feed", item.feed_id);
      });
    }
    if (openButton) {
      openButton.addEventListener("click", () => openItem(item.url));
    }
    elements.cards.appendChild(card);
  });
}

function renderSavedCards() {
  elements.cards.innerHTML = "";
  if (state.savedItems.length === 0) {
    renderEmptyCards("No saved articles yet", "Save stories to build your archive.");
    return;
  }

  state.savedItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${escapeHtml(item.item_title || "Saved item")}</div>
      <div class="card-meta">${escapeHtml(item.feed_title || "Saved")}</div>
      <div class="card-body">${truncate(stripHtml(item.item_summary || ""), 220)}</div>
      <div class="card-actions">
        <button type="button">Open</button>
        <button type="button">Annotate</button>
        <button type="button">Tag</button>
        <button type="button">Delete</button>
      </div>
    `;
    const [openButton, annotateButton, tagButton, deleteButton] =
      card.querySelectorAll("button");
    if (openButton) {
      openButton.addEventListener("click", () => openItem(item.item_url));
    }
    if (annotateButton) {
      annotateButton.addEventListener("click", () => openSavedReader(item));
    }
    if (tagButton) {
      tagButton.addEventListener("click", async () => {
        await tagTarget("saved", item.id);
      });
    }
    if (deleteButton) {
      deleteButton.addEventListener("click", async () => {
        await deleteSavedItem(item.id);
      });
    }
    elements.cards.appendChild(card);
  });
}

function renderEmptyCards(title = "No stories yet", body = "Add a feed to start building your calm reading queue.") {
  elements.cards.innerHTML = `
    <article class="card">
      <div class="card-title">${title}</div>
      <div class="card-body">${body}</div>
    </article>
  `;
}

async function subscribe(url) {
  elements.subscribeMessage.textContent = "Looking for feeds...";
  try {
    const discover = await apiPost("/feeds/discover", { url });
    const candidate = discover.candidates?.[0];
    if (!candidate) {
      elements.subscribeMessage.textContent = "No feeds found at that URL.";
      return;
    }

    const created = await apiPost("/feeds", {
      feedUrl: candidate.feedUrl,
      siteUrl: candidate.siteUrl ?? url,
      title: candidate.title ?? null,
    });

    elements.subscribeMessage.textContent = created.created
      ? "Feed added. Refreshing..."
      : "Feed already exists. Refreshing...";

    await loadFeeds();
    if (created.feed?.id) {
      await refreshFeed(created.feed.id);
      selectFeed(created.feed.id);
    }
  } catch (error) {
    elements.subscribeMessage.textContent = "Could not add the feed. Try again.";
  }
}

async function refreshFeed(feedId = state.selectedFeedId) {
  if (state.view === "saved") {
    await loadSavedItems();
    return;
  }

  if (!feedId) return;
  try {
    await apiPost(`/feeds/${feedId}/refresh`);
    await loadFeedItems(feedId);
  } catch {
    // ignore for now
  }
}

async function saveItem(item, button) {
  if (!item?.id) return;
  try {
    await apiPost("/saved", { feedItemId: item.id });
    item.saved = true;
    if (button) {
      button.textContent = "Saved";
      button.disabled = true;
    }
  } catch {
    // ignore for now
  }
}

async function deleteSavedItem(savedId) {
  if (!savedId) return;
  try {
    await apiDelete(`/saved/${savedId}`);
    await loadSavedItems();
  } catch {
    // ignore for now
  }
}

function openItem(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener");
}

function setNavActive(view) {
  elements.navItems.forEach((item) => {
    const isActive = item.dataset.view === view;
    item.classList.toggle("active", isActive);
  });
}

function setView(view) {
  state.view = view;
  if (view === "saved") {
    elements.cardsTitle.textContent = "Saved";
    elements.cardsSub.textContent = "Your personal archive.";
    setNavActive("saved");
    closeReader();
    loadSavedItems();
    return;
  }

  if (view === "tags") {
    elements.cardsTitle.textContent = "Tags";
    elements.cardsSub.textContent = "Tag filtering is coming soon.";
    setNavActive("tags");
    renderEmptyCards("Tags", "Tag management is coming soon.");
    return;
  }

  setNavActive("today");
  if (state.selectedFeedId) {
    selectFeed(state.selectedFeedId);
  } else if (state.feeds.length > 0) {
    selectFeed(state.feeds[0].id);
  } else {
    renderEmptyCards();
  }
}

async function tagTarget(targetType, targetId) {
  if (!targetId) return;
  state.tagging = { targetType, targetId };
  elements.tagInput.value = "";
  elements.tagSuggestions.innerHTML = "";
  elements.tagModal.classList.remove("hidden");
  await loadTagSuggestions("");
  elements.tagInput.focus();
}

async function loadTagSuggestions(query) {
  try {
    const data = await apiGet(`/tags?query=${encodeURIComponent(query)}&limit=8`);
    const tags = data.tags ?? [];
    elements.tagSuggestions.innerHTML = "";
    if (tags.length === 0) {
      elements.tagSuggestions.innerHTML = `<div class="card-body">No suggestions yet.</div>`;
      return;
    }

    tags.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag-suggestion";
      button.textContent = tag.name;
      button.addEventListener("click", async () => {
        await applyTag(tag.name);
      });
      elements.tagSuggestions.appendChild(button);
    });
  } catch {
    elements.tagSuggestions.innerHTML = `<div class="card-body">Failed to load tags.</div>`;
  }
}

async function applyTag(name) {
  const trimmed = name.trim();
  if (!trimmed || !state.tagging.targetId) return;

  try {
    const tagResult = await apiPost("/tags", { name: trimmed });
    const tagId = tagResult.tag?.id;
    if (!tagId) return;
    await apiPost("/tags/link", {
      targetType: state.tagging.targetType,
      targetId: state.tagging.targetId,
      tagId,
    });
    closeTagModal();
  } catch {
    // ignore
  }
}

function closeTagModal() {
  elements.tagModal.classList.add("hidden");
  state.tagging = { targetType: null, targetId: null };
}

async function openSavedReader(item) {
  if (!item?.id) return;
  try {
    const data = await apiGet(`/saved/${item.id}/content`);
    state.reader.savedId = item.id;
    state.reader.html = normalizeArticleHtml(data.html ?? "");
    state.reader.version = data.version ?? 0;
    state.reader.dirty = false;

    elements.readerTitle.textContent = item.item_title || "Saved article";
    elements.readerSub.textContent = item.feed_title || "Annotate inline";
    elements.readerContent.innerHTML = state.reader.html;
    elements.reader.classList.remove("hidden");
    elements.readerSave.textContent = "Save highlights";
  } catch {
    // ignore
  }
}

function closeReader() {
  elements.reader.classList.add("hidden");
  state.reader = { savedId: null, html: "", version: 0, dirty: false };
}

function getSelectionRange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!elements.readerContent.contains(range.commonAncestorContainer)) {
    return null;
  }
  if (range.collapsed) return null;
  return range;
}

async function createAnnotation(type) {
  const range = getSelectionRange();
  if (!range) return;

  const annotationId = crypto.randomUUID();
  const anchor = {
    type: "text-range",
    text: range.toString().slice(0, 120),
  };

  let wrapper;
  if (type === "highlight") {
    wrapper = document.createElement("mark");
  } else {
    wrapper = document.createElement("span");
    wrapper.className = "anno-comment";
  }

  wrapper.dataset.annoId = annotationId;
  wrapper.dataset.annoType = type;

  if (type === "comment") {
    const text = window.prompt("Comment");
    if (!text) return;
    wrapper.dataset.annoText = text;
    await apiPost("/annotations", {
      savedItemId: state.reader.savedId,
      type,
      anchor,
      text,
    });
  } else {
    await apiPost("/annotations", {
      savedItemId: state.reader.savedId,
      type,
      anchor,
    });
  }

  try {
    range.surroundContents(wrapper);
  } catch {
    wrapper.append(range.extractContents());
    range.insertNode(wrapper);
  }

  state.reader.dirty = true;
}

async function saveReaderContent() {
  if (!state.reader.savedId) return;
  if (!state.reader.dirty) return;

  const html = elements.readerContent.innerHTML;
  try {
    const result = await apiPut(`/saved/${state.reader.savedId}/content`, {
      html,
      version: state.reader.version,
    });
    state.reader.version = result.version ?? state.reader.version;
    state.reader.dirty = false;
    elements.readerSave.textContent = "Saved";
    setTimeout(() => {
      elements.readerSave.textContent = "Save highlights";
    }, 1000);
  } catch {
    elements.readerSave.textContent = "Save failed";
  }
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeArticleHtml(html) {
  if (!html) return "";
  if (!html.toLowerCase().includes("<html")) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body?.innerHTML ?? html;
}

function truncate(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function init() {
  elements.subscribeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = elements.subscribeInput.value.trim();
    if (url) {
      subscribe(url);
      elements.subscribeInput.value = "";
    }
  });

  elements.refreshFeed.addEventListener("click", () => refreshFeed());
  elements.savedView.addEventListener("click", () => setView("saved"));
  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (view) {
        setView(view);
      }
    });
  });

  elements.readerClose.addEventListener("click", () => closeReader());
  elements.readerSave.addEventListener("click", () => saveReaderContent());
  elements.readerContent.addEventListener("mouseup", () => {
    if (!state.reader.savedId) return;
    const range = getSelectionRange();
    if (!range) return;
    const action = window.prompt("Type 'h' to highlight, 'c' to comment.");
    if (action === "h") {
      createAnnotation("highlight");
    } else if (action === "c") {
      createAnnotation("comment");
    }
  });

  elements.tagCancel.addEventListener("click", () => closeTagModal());
  elements.tagSave.addEventListener("click", () => applyTag(elements.tagInput.value));
  elements.tagInput.addEventListener("input", (event) => {
    const value = event.target.value;
    loadTagSuggestions(value);
  });
  elements.tagModal.addEventListener("click", (event) => {
    if (event.target === elements.tagModal) {
      closeTagModal();
    }
  });

  loadFeeds();
}

init();
