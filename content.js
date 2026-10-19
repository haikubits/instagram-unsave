(() => {
  const APP_ID = "936619743392459"; // Instagram web app id
  const DELAY_MS = 1500; // pause between unsave requests
  const BACKOFF_MS = 5 * 60 * 1000; // wait after a 429

  let running = false;
  let cancelled = false;

  const csrf = () => (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || "";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const onSavedPage = () => /\/saved(\/|$)/.test(location.pathname);

  const headers = () => ({
    "x-csrftoken": csrf(),
    "x-ig-app-id": APP_ID,
    "x-requested-with": "XMLHttpRequest",
    "content-type": "application/x-www-form-urlencoded",
  });

  async function request(url, options, ui) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, { credentials: "include", headers: headers(), ...options });
      if (res.status === 429) {
        for (let s = BACKOFF_MS / 1000; s > 0 && !cancelled; s--) {
          ui.status(`Rate limited by Instagram. Resuming in ${s}s...`);
          await sleep(1000);
        }
        if (cancelled) throw new Error("cancelled");
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res.json();
    }
    throw new Error("Still rate limited. Try again later.");
  }

  async function unsaveAll(ui) {
    let unsaved = 0;
    const seen = new Set();

    while (!cancelled) {
      // Unsaved items disappear, so the first page always holds the next batch.
      const page = await request(
        "https://www.instagram.com/api/v1/feed/saved/posts/",
        { method: "GET" },
        ui
      );
      const ids = (page.items || [])
        .map((i) => i.media && (i.media.pk || i.media.id))
        .filter((id) => id && !seen.has(id));

      if (ids.length === 0) break; // nothing new: finished (or unsaves aren't taking effect)

      for (const id of ids) {
        if (cancelled) return unsaved;
        seen.add(id);
        await request(
          `https://www.instagram.com/api/v1/web/save/${id}/unsave/`,
          { method: "POST" },
          ui
        );
        unsaved++;
        ui.status(`Unsaved ${unsaved} posts...`);
        await sleep(DELAY_MS);
      }
    }
    return unsaved;
  }

  function createUI() {
    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;right:16px;bottom:16px;z-index:999999;background:#fff;color:#111;" +
      "border:1px solid #dbdbdb;border-radius:12px;padding:12px;font:14px system-ui,sans-serif;" +
      "box-shadow:0 2px 12px rgba(0,0,0,.2);max-width:280px;display:flex;flex-direction:column;gap:8px";
    const text = document.createElement("div");
    text.textContent = "Simple Instagram Unsaver";
    const btn = document.createElement("button");
    btn.textContent = "Unsave all";
    btn.style.cssText =
      "background:#ed4956;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:600";
    box.append(text, btn);
    document.body.appendChild(box);

    const ui = { box, status: (t) => (text.textContent = t) };

    btn.onclick = async () => {
      if (running) {
        cancelled = true;
        btn.disabled = true;
        return;
      }
      if (!confirm("Unsave ALL your saved posts? This cannot be undone.")) return;
      running = true;
      cancelled = false;
      btn.textContent = "Cancel";
      try {
        const n = await unsaveAll(ui);
        ui.status(`${cancelled ? "Cancelled" : "Done"}. Unsaved ${n} posts. Reload the page.`);
      } catch (e) {
        ui.status(cancelled ? "Cancelled." : `Error: ${e.message}`);
      }
      running = false;
      btn.disabled = false;
      btn.textContent = "Unsave all";
    };
    return ui;
  }

  // Instagram is a single-page app, so watch for URL changes.
  let ui = null;
  setInterval(() => {
    if (onSavedPage() && !ui) ui = createUI();
    else if (!onSavedPage() && ui && !running) {
      ui.box.remove();
      ui = null;
    }
  }, 500);
})();
