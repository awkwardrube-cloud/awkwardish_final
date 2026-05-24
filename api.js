const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

export async function fetchEpisodes(limit = 6) {
  const res = await fetch(`${BASE}/episodes?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch episodes");
  return res.json();
}

export async function subscribeNewsletter({ email, first_name }) {
  const res = await fetch(`${BASE}/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, first_name: first_name || null }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { response: { data } };
  }
  return res.json();
}
