import { useEffect, useState } from "react";
import { fetchEpisodes } from "../lib/api";

export function useLatestEpisode() {
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEpisodes(1)
      .then((data) => {
        if (cancelled) return;
        const ep = data?.episodes?.[0] ?? null;
        setEpisode(ep);
      })
      .catch(() => {
        if (!cancelled) setEpisode(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { episode, loading };
}
