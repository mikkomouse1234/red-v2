import express from "express";
import path from "path";

const app = express();
const PORT = 3001;

// API keys baked in
const COMICVINE_KEY = "dd45e55865c370ffd81e221c78f632e518168f5b";
const COMICVINE_BASE = "https://comicvine.gamespot.com/api";
const MANGADEX_BASE = "https://api.mangadex.org";

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function cvFetch(resource: string, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({
    api_key: COMICVINE_KEY,
    format: "json",
    ...extra,
  });
  return fetch(`${COMICVINE_BASE}/${resource}?${p}`, {
    headers: { "User-Agent": "OmniComic/1.0" },
  });
}

async function mdFetch(url: string) {
  return fetch(url, {
    headers: { "User-Agent": "OmniComic/1.0", Accept: "application/json" },
  });
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim().slice(0, 500);
}

// ─── ComicVine: search volumes ───────────────────────────────────────────────
app.get("/api/comics/search", async (req, res) => {
  try {
    const query = (req.query.q as string) || "";
    const sort  = (req.query.sort as string) || "";

    let url: string;
    const fields = "id,name,description,image,publisher,start_year,count_of_issues,genres";

    if (query) {
      const p = new URLSearchParams({
        api_key: COMICVINE_KEY,
        format: "json",
        resources: "volume",
        query,
        field_list: fields,
        limit: "20",
      });
      url = `${COMICVINE_BASE}/search/?${p}`;
    } else {
      const order = sort === "recent" ? "date_added:desc" : "date_added:desc";
      const p = new URLSearchParams({
        api_key: COMICVINE_KEY,
        format: "json",
        field_list: fields,
        limit: "20",
        sort: order,
      });
      url = `${COMICVINE_BASE}/volumes/?${p}`;
    }

    const r = await fetch(url, { headers: { "User-Agent": "OmniComic/1.0" } });
    if (!r.ok) return res.status(r.status).json({ error: "ComicVine API error" });

    const json = await r.json() as {
      error: string;
      results: Array<{
        id: number; name: string; description: string | null;
        image: { medium_url: string; super_url: string } | null;
        publisher: { name: string } | null;
        start_year: string | null; count_of_issues: number;
        genres?: Array<{ name: string }>;
      }>;
    };

    if (json.error !== "OK") return res.status(400).json({ error: json.error });

    const results = (json.results || []).map((v) => ({
      id: `cv-${v.id}`,
      comicvineId: String(v.id),
      title: v.name,
      description: stripHtml(v.description),
      coverUrl: v.image?.medium_url || "",
      bannerUrl: v.image?.super_url || v.image?.medium_url || "",
      publisher: v.publisher?.name || "",
      author: v.publisher?.name || "",
      status: "Ongoing",
      genres: (v.genres || []).map((g) => g.name),
      releaseYear: v.start_year || null,
      source: "comicvine",
      type: "comic",
      totalChapters: v.count_of_issues || 0,
    }));

    res.json({ results, total: results.length });
  } catch (err) {
    console.error("ComicVine search error:", err);
    res.status(500).json({ error: "Unable to load comics." });
  }
});

// ─── ComicVine: volume details ────────────────────────────────────────────────
app.get("/api/comics/volume/:id", async (req, res) => {
  try {
    const rawId = req.params.id.replace(/^cv-/, "");
    const fields = "id,name,description,image,publisher,start_year,count_of_issues,genres,issues,people";
    const p = new URLSearchParams({ api_key: COMICVINE_KEY, format: "json", field_list: fields });
    const r = await fetch(`${COMICVINE_BASE}/volume/4050-${rawId}/?${p}`, {
      headers: { "User-Agent": "OmniComic/1.0" },
    });
    if (!r.ok) return res.status(r.status).json({ error: "Comic not found" });
    const json = await r.json() as { error: string; results: Record<string, unknown> };
    if (json.error !== "OK") return res.status(400).json({ error: json.error });
    res.json(json.results);
  } catch (err) {
    console.error("ComicVine volume error:", err);
    res.status(500).json({ error: "Unable to load comic details." });
  }
});

// ─── ComicVine: issues for a volume ──────────────────────────────────────────
app.get("/api/comics/volume/:id/issues", async (req, res) => {
  try {
    const rawId = req.params.id.replace(/^cv-/, "");
    const p = new URLSearchParams({
      api_key: COMICVINE_KEY,
      format: "json",
      field_list: "id,issue_number,name,cover_date,image,description",
      filter: `volume:${rawId}`,
      sort: "issue_number:asc",
      limit: "100",
    });
    const r = await fetch(`${COMICVINE_BASE}/issues/?${p}`, {
      headers: { "User-Agent": "OmniComic/1.0" },
    });
    if (!r.ok) return res.status(r.status).json({ error: "Issues not found" });
    const json = await r.json() as {
      error: string;
      results: Array<{ id: number; issue_number: string; name: string | null; cover_date: string | null; image: { medium_url: string } | null }>;
    };
    if (json.error !== "OK") return res.status(400).json({ error: json.error });
    res.json({ results: json.results });
  } catch (err) {
    console.error("ComicVine issues error:", err);
    res.status(500).json({ error: "Unable to load issues." });
  }
});

// ─── MangaDex: search ────────────────────────────────────────────────────────
app.get("/api/manga/search", async (req, res) => {
  try {
    const title  = (req.query.q      as string) || "";
    const sort   = (req.query.sort   as string) || "";
    const genre  = (req.query.genre  as string) || "";
    const limit  = Math.min(Number(req.query.limit)  || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const p = new URLSearchParams();
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    ["cover_art","author","artist"].forEach(i => p.append("includes[]", i));
    ["safe","suggestive"].forEach(c => p.append("contentRating[]", c));

    if (title) {
      p.set("title", title);
      p.set("order[relevance]", "desc");
    } else if (sort === "recent") {
      p.set("order[updatedAt]", "desc");
    } else if (sort === "rating") {
      p.set("order[rating]", "desc");
    } else {
      p.set("order[followedCount]", "desc");
    }

    if (genre && genre !== "All") {
      try {
        const tr = await mdFetch(`${MANGADEX_BASE}/manga/tag`);
        if (tr.ok) {
          const td = await tr.json() as { data: Array<{ id: string; attributes: { name: Record<string,string> } }> };
          const match = td.data.find(t => (t.attributes.name.en||"").toLowerCase() === genre.toLowerCase());
          if (match) p.append("includedTags[]", match.id);
        }
      } catch { /* genre filter optional */ }
    }

    const r = await mdFetch(`${MANGADEX_BASE}/manga?${p}`);
    if (!r.ok) return res.status(r.status).json({ error: "Unable to load manga." });
    res.json(await r.json());
  } catch (err) {
    console.error("MangaDex search error:", err);
    res.status(500).json({ error: "Unable to load manga." });
  }
});

// ─── MangaDex: manga details ──────────────────────────────────────────────────
app.get("/api/manga/:id", async (req, res) => {
  try {
    const p = new URLSearchParams();
    ["cover_art","author","artist"].forEach(i => p.append("includes[]", i));
    const r = await mdFetch(`${MANGADEX_BASE}/manga/${req.params.id}?${p}`);
    if (!r.ok) return res.status(r.status).json({ error: "Manga not found." });
    res.json(await r.json());
  } catch (err) {
    console.error("MangaDex details error:", err);
    res.status(500).json({ error: "Unable to load manga details." });
  }
});

// ─── MangaDex: chapter feed (auto-paginated) ─────────────────────────────────
app.get("/api/manga/:id/feed", async (req, res) => {
  try {
    const lang = (req.query.lang as string) || "en";
    let all: unknown[] = [], offset = 0, total = Infinity;

    while (all.length < total) {
      const p = new URLSearchParams();
      p.append("translatedLanguage[]", lang);
      p.set("order[volume]", "asc");
      p.set("order[chapter]", "asc");
      p.set("limit", "500");
      p.set("offset", String(offset));
      p.append("includes[]", "scanlation_group");

      const r = await mdFetch(`${MANGADEX_BASE}/manga/${req.params.id}/feed?${p}`);
      if (!r.ok) {
        if (all.length === 0) return res.status(r.status).json({ error: "Unable to load chapters." });
        break;
      }
      const page = await r.json() as { data: unknown[]; total: number };
      total = page.total;
      all = all.concat(page.data);
      offset += page.data.length;
      if (!page.data.length) break;
    }

    res.json({ data: all, total: all.length });
  } catch (err) {
    console.error("MangaDex feed error:", err);
    res.status(500).json({ error: "Unable to load chapters." });
  }
});

// ─── MangaDex: at-home server ─────────────────────────────────────────────────
app.get("/api/manga/chapter/:chapterId/pages", async (req, res) => {
  try {
    const r = await mdFetch(`${MANGADEX_BASE}/at-home/server/${req.params.chapterId}`);
    if (!r.ok) return res.status(r.status).json({ error: "Unable to load chapter pages." });
    res.json(await r.json());
  } catch (err) {
    console.error("MangaDex at-home error:", err);
    res.status(500).json({ error: "Unable to load chapter pages." });
  }
});

// ─── Image proxy (for MangaDex covers + pages — needs Referer header) ─────────
app.get("/api/proxy-image", async (req, res) => {
  const raw = req.query.url as string;
  if (!raw) return res.status(400).send("url required");

  let parsed: URL;
  try { parsed = new URL(raw); } catch { return res.status(400).send("invalid url"); }

  const h = parsed.hostname.toLowerCase();
  if (!h.endsWith(".mangadex.org") && !h.endsWith(".mangadex.network")) {
    return res.status(403).send("domain not allowed");
  }

  try {
    const r = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://mangadex.org/",
        "Origin": "https://mangadex.org",
      },
    });
    if (!r.ok) return res.status(r.status).send("upstream error");
    const ct = r.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(502).send("proxy error");
  }
});

// ─── Static (production) ──────────────────────────────────────────────────────
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OmniComic API server → http://localhost:${PORT}`);
});
