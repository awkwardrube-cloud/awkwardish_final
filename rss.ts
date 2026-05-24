const FEED_URL = "https://anchor.fm/s/10997502c/podcast/rss";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { episodes: RssEpisode[]; fetchedAt: number } | null = null;

export interface RssEpisode {
  id: string;
  title: string;
  description: string;
  duration: string;
  episode_number: number | null;
  release_date: string | null;
  spotify_url: string | null;
  image_url: string | null;
  audio_url: string | null;
}

function extractCdata(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return "";
  return (m[1] ?? m[2] ?? "").trim();
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(p|li|ul|ol|div|h[1-6]|strong|em|b|i|a|span)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8209;/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseDuration(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (h > 0) return `${h}h ${m}m`;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
  return raw;
}

function formatDate(pubDate: string): string | null {
  if (!pubDate) return null;
  try {
    return new Date(pubDate).toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function parseItems(xml: string, limit: number): RssEpisode[] {
  const items: RssEpisode[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null && items.length < limit) {
    const block = match[1];

    const epType = extractTag(block, "itunes:episodeType");
    if (epType && epType !== "full") continue;

    const title = extractCdata(block, "title");
    if (!title) continue;

    const rawDesc = extractCdata(block, "description");
    const description = stripHtml(rawDesc).slice(0, 600);

    const duration = parseDuration(extractTag(block, "itunes:duration"));
    const epNum = parseInt(extractTag(block, "itunes:episode"), 10);
    const pubDate = extractTag(block, "pubDate");
    const link = extractTag(block, "link") || extractTag(block, "guid");
    const guid = extractCdata(block, "guid") || extractTag(block, "guid");
    const imageUrl = extractAttr(block, "itunes:image", "href");

    const audioUrl = extractAttr(block, "enclosure", "url");

    items.push({
      id: guid || title,
      title,
      description,
      duration,
      episode_number: isNaN(epNum) ? null : epNum,
      release_date: formatDate(pubDate),
      spotify_url: link || null,
      image_url: imageUrl || null,
      audio_url: audioUrl || null,
    });
  }

  return items;
}

export async function fetchRssEpisodes(limit = 6): Promise<RssEpisode[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.episodes.slice(0, limit);
  }

  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "Awkwardish-Site/1.0 (podcast website)" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const xml = await res.text();
  const episodes = parseItems(xml, 20);

  cache = { episodes, fetchedAt: Date.now() };
  return episodes.slice(0, limit);
}
