/**
 * Yahoo Finance News Fetcher (RapidAPI)
 */

const RAPIDAPI_KEY =
  process.env.EXPO_PUBLIC_RAPIDAPI_KEY ||
  "e3664017e8msh27dfa91bf77b66ep10ced7jsnba390bf25d6c";
const RAPIDAPI_HOST =
  process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "yahoo-finance15.p.rapidapi.com";
const API_BASE = `https://${RAPIDAPI_HOST}`;

const NEWS_ENDPOINTS = ["/api/v1/markets/news", "/api/v1/markets/news/"];

const toIso = (value) => {
  if (!value) return null;
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeNewsItem = (item) => {
  const title = item.title || item.headline || item.summary || "";
  const link = item.link || item.url || item.clickThroughUrl || "";
  const publishedAt =
    toIso(item.pubDate) ||
    toIso(item.published_at) ||
    toIso(item.providerPublishTime) ||
    toIso(item.time) ||
    null;
  const publisher =
    item.publisher?.name ||
    item.publisher ||
    item.source ||
    item.provider ||
    "";
  const thumbnail =
    item.thumbnail?.resolutions?.[0]?.url ||
    item.thumbnail?.url ||
    item.image?.url ||
    item.image ||
    null;

  return {
    id: item.uuid || item.id || link || title,
    title,
    link,
    publishedAt,
    publisher,
    summary: item.summary || item.description || "",
    thumbnail,
  };
};

const extractItems = (data) =>
  data?.data || data?.news || data?.items || data?.body || data?.results || [];

export async function fetchYahooNews({ region = "IN", limit = 20 } = {}) {
  const headers = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };

  for (const endpoint of NEWS_ENDPOINTS) {
    const url = `${API_BASE}${endpoint}?region=${encodeURIComponent(
      region,
    )}&limit=${encodeURIComponent(limit)}`;

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const items = extractItems(data);

      if (Array.isArray(items) && items.length > 0) {
        return items.map(normalizeNewsItem).slice(0, limit);
      }
    } catch (error) {
      continue;
    }
  }

  return [];
}
