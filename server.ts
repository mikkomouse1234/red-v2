import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const MANGADEX_BASE = "https://api.mangadex.org";
const MANGADEX_UPLOADS = "https://uploads.mangadex.org";

async function mdFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": "OmniComic-Reader/2.0 (contact@omnicomic.app)",
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // ------------------------------------------------------------------
  // MangaDex: Search / browse manga
  // GET /api/mangadex/search
  //   ?title=      – optional title search
  //   ?limit=      – results per page (default 20, max 100)
  //   ?offset=     – pagination offset (default 0)
  //   ?sort=       – "popular" | "recent" | "rating" | undefined
  //   ?genre=      – genre tag name filter
  // ------------------------------------------------------------------
  app.get("/api/mangadex/search", async (req, res) => {
    try {
      const title  = (req.query.title  as string) || "";
      const limit  = Math.min(Number(req.query.limit)  || 20, 100);
      const offset = Number(req.query.offset) || 0;
      const sort   = (req.query.sort   as string) || "";

      const params = new URLSearchParams();
      params.set("limit",  String(limit));
      params.set("offset", String(offset));
      ["cover_art", "author", "artist"].forEach((inc) => params.append("includes[]", inc));
      ["safe", "suggestive"].forEach((cr) => params.append("contentRating[]", cr));

      if (title) {
        params.set("title", title);
        params.set("order[relevance]", "desc");
      } else if (sort === "popular") {
        params.set("order[followedCount]", "desc");
      } else if (sort === "recent") {
        params.set("order[updatedAt]", "desc");
      } else if (sort === "rating") {
        params.set("order[rating]", "desc");
      } else {
        // default browse: popular
        params.set("order[followedCount]", "desc");
      }

      // Genre filter: look up tag ID first
      const genre = (req.query.genre as string) || "";
      if (genre && genre !== "All") {
        try {
          const tagRes = await mdFetch(`${MANGADEX_BASE}/manga/tag`);
          if (tagRes.ok) {
            const tagData = await tagRes.json() as { data: Array<{ id: string; attributes: { name: Record<string, string> } }> };
            const matched = tagData.data.find(
              (t) => (t.attributes.name.en || "").toLowerCase() === genre.toLowerCase()
            );
            if (matched) params.append("includedTags[]", matched.id);
          }
        } catch {
          // genre filter optional; continue without it
        }
      }

      const response = await mdFetch(`${MANGADEX_BASE}/manga?${params}`);
      if (!response.ok) {
        console.error(`MangaDex search failed: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: "Unable to load manga from MangaDex." });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("MangaDex search proxy error:", err);
      res.status(500).json({ error: "Unable to load manga from MangaDex." });
    }
  });

  // ------------------------------------------------------------------
  // MangaDex: Single manga details
  // GET /api/mangadex/manga/:id
  // ------------------------------------------------------------------
  app.get("/api/mangadex/manga/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const params = new URLSearchParams();
      ["cover_art", "author", "artist"].forEach((inc) => params.append("includes[]", inc));

      const response = await mdFetch(`${MANGADEX_BASE}/manga/${id}?${params}`);
      if (!response.ok) {
        console.error(`MangaDex manga details failed: ${response.status}`);
        return res.status(response.status).json({ error: "Unable to load manga details." });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("MangaDex manga details proxy error:", err);
      res.status(500).json({ error: "Unable to load manga details." });
    }
  });

  // ------------------------------------------------------------------
  // MangaDex: Chapter feed (paginated, auto-fetches all pages)
  // GET /api/mangadex/manga/:id/feed
  //   ?lang=en  (default)
  //   ?limit=   (per-request page size, default 500)
  // ------------------------------------------------------------------
  app.get("/api/mangadex/manga/:id/feed", async (req, res) => {
    try {
      const { id } = req.params;
      const lang  = (req.query.lang  as string) || "en";
      const pageSize = Math.min(Number(req.query.limit) || 500, 500);

      // Fetch all chapters by paginating until we have them all
      let allChapters: unknown[] = [];
      let offset = 0;
      let total = Infinity;

      while (allChapters.length < total) {
        const params = new URLSearchParams();
        params.append("translatedLanguage[]", lang);
        params.set("order[volume]",  "asc");
        params.set("order[chapter]", "asc");
        params.set("limit",  String(pageSize));
        params.set("offset", String(offset));
        params.append("includes[]", "scanlation_group");

        const response = await mdFetch(`${MANGADEX_BASE}/manga/${id}/feed?${params}`);
        if (!response.ok) {
          console.error(`MangaDex feed failed at offset ${offset}: ${response.status}`);
          if (allChapters.length === 0) {
            return res.status(response.status).json({ error: "Unable to load chapters." });
          }
          break; // return partial results
        }

        const page = await response.json() as { data: unknown[]; limit: number; offset: number; total: number };
        total = page.total;
        allChapters = allChapters.concat(page.data);
        offset += page.data.length;

        if (page.data.length === 0) break; // nothing more
      }

      res.json({
        data:   allChapters,
        limit:  allChapters.length,
        offset: 0,
        total:  allChapters.length,
      });
    } catch (err) {
      console.error("MangaDex feed proxy error:", err);
      res.status(500).json({ error: "Unable to load chapters." });
    }
  });

  // ------------------------------------------------------------------
  // MangaDex: At-Home server (real page URLs)
  // GET /api/mangadex/at-home/server/:chapterId
  // ------------------------------------------------------------------
  app.get("/api/mangadex/at-home/server/:chapterId", async (req, res) => {
    try {
      const { chapterId } = req.params;
      const response = await mdFetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`);
      if (!response.ok) {
        console.error(`MangaDex at-home failed: ${response.status}`);
        return res.status(response.status).json({ error: "Unable to load this chapter." });
      }
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("MangaDex at-home proxy error:", err);
      res.status(500).json({ error: "Unable to load this chapter." });
    }
  });

  // ------------------------------------------------------------------
  // Image proxy (handles CORS for manga page images)
  // GET /api/proxy-image?url=<encoded-url>
  // ------------------------------------------------------------------
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send("url parameter required");

    // Only proxy MangaDex / uploads domains
    const allowed = [MANGADEX_UPLOADS, "https://cmdxd98sb0x3yprd.mangadex.network"];
    const isAllowed = allowed.some((prefix) => imageUrl.startsWith(prefix));
    if (!isAllowed) return res.status(403).send("Forbidden domain");

    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://mangadex.org/",
        },
      });
      if (!response.ok) return res.status(response.status).send("Failed to fetch image");

      res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Image proxy error:", err);
      res.status(500).send("Proxy error");
    }
  });

  // Vite middleware or static dist
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OmniComic server running on http://localhost:${PORT}`);
  });
}

startServer();
