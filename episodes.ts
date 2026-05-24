import { Router, type IRouter } from "express";
import { fetchRssEpisodes } from "../lib/rss";

const router: IRouter = Router();

router.get("/episodes", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "6"), 10) || 6, 20);

  try {
    const episodes = await fetchRssEpisodes(limit);
    res.json({ episodes, source: "rss" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch episodes";
    req.log.error({ err }, "RSS episodes fetch failed");
    res.status(500).json({ detail: message });
  }
});

export default router;
