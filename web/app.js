const API_BASE = "/api";

const state = {
  feeds: [],
  selectedFeedId: null,
  items: [],
  savedItems: [],
  view: "feed",
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
        <button type="button">Open</button>
      </div>
    `;
    const [saveButton, openButton] = card.querySelectorAll("button");
    if (saveButton) {
      saveButton.addEventListener("click", async () => {
        await saveItem(item, saveButton);
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
      </div>
    `;
    const [openButton] = card.querySelectorAll("button");
    if (openButton) {
      openButton.addEventListener("click", () => openItem(item.item_url));
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

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

  loadFeeds();
}

init();
