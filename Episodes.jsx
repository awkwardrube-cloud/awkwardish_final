import { useEffect, useState } from "react";
import { SITE } from "../../data/site";
import { Play, Clock } from "lucide-react";
import { fetchEpisodes } from "../../lib/api";
import { usePlayer } from "../../context/PlayerContext";
import { EpisodeShare } from "../EpisodeShare";

const SPOTIFY_SHOW = "https://open.spotify.com/show/0UChrcN9cdZc8ahsFmh7t5";

const TAG_BY_KEYWORD = [
  { match: /spotlight|stage|perform|visib/i, tag: "Mental Health" },
  { match: /anxiety|anxious|panic/i, tag: "Coping & Care" },
  { match: /identity|becoming|reinvent|new/i, tag: "Identity & Growth" },
  { match: /heal|healing/i, tag: "Healing" },
  { match: /community|togeth|care/i, tag: "Community Care" },
  { match: /courage|brave|fear/i, tag: "Courage" },
  { match: /boring|slow|patience/i, tag: "The Slow Work" },
];

const tagFor = (title = "") => {
  for (const { match, tag } of TAG_BY_KEYWORD) if (match.test(title)) return tag;
  return "Episode";
};

const formatDuration = (raw) => {
  if (!raw) return "Listen";
  return raw;
};

export const Episodes = () => {
  const [episodes, setEpisodes] = useState(null);
  const [error, setError] = useState(false);
  const { play, currentEpisode } = usePlayer();

  useEffect(() => {
    let cancelled = false;
    fetchEpisodes(6)
      .then((data) => {
        if (cancelled) return;
        if (data?.episodes?.length) setEpisodes(data.episodes);
        else setError(true);
      })
      .catch(() => !cancelled && setError(true));
    return () => { cancelled = true; };
  }, []);

  const list =
    episodes ||
    (error
      ? SITE.episodes.map((e, i) => ({
          id: `static-${i}`,
          title: e.title,
          description: e.description,
          duration: null,
          episode_number: SITE.episodes.length - i,
          audio_url: null,
          spotify_url: null,
          image_url: null,
        }))
      : null);

  const handlePlay = (e, ep) => {
    if (ep.audio_url) {
      e.preventDefault();
      play(ep);
    }
    // else falls through to the <a> href (Spotify)
  };

  return (
    <section id="episodes" data-testid="episodes-section" className="relative py-24 sm:py-32 bg-[#341434] text-[#F5E9D7] overflow-hidden">
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-[#E0578F]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-[460px] h-[460px] rounded-full bg-[#E1C9A7]/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16 reveal">
          <div>
            <p className="font-script text-3xl text-[#F0A6BF]">— episodes</p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[0.95] mt-1">
              Soft truths,
              <br />
              <span className="italic text-[#F0A6BF]">said out loud.</span>
            </h2>
          </div>
          <p className="max-w-md text-[#F5E9D7]/80 text-lg leading-relaxed">
            Latest episodes — straight from the feed. Pick one that meets you where you are today.
          </p>
        </div>

        {!list && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[28px] bg-[#F5E9D7]/8 h-72 animate-pulse" data-testid={`episode-skeleton-${i}`} />
            ))}
          </div>
        )}

        {list && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((ep, i) => {
              const isPlaying = currentEpisode?.id === ep.id;
              const canPlay = Boolean(ep.audio_url);
              return (
                <a
                  key={ep.id || i}
                  href={ep.spotify_url || SPOTIFY_SHOW}
                  target={canPlay ? undefined : "_blank"}
                  rel={canPlay ? undefined : "noreferrer"}
                  onClick={(e) => handlePlay(e, ep)}
                  data-testid={`episode-card-${i}`}
                  className={`group relative rounded-[28px] bg-[#F5E9D7] text-[#1F1216] p-7 flex flex-col gap-5 hover:-translate-y-2 transition-all duration-500 shadow-cozy cursor-pointer ${
                    isPlaying ? "ring-2 ring-[#E0578F] ring-offset-2 ring-offset-[#341434]" : ""
                  }`}
                >
                  {/* Episode artwork thumbnail */}
                  {ep.image_url && (
                    <div className="absolute top-7 right-7 w-14 h-14 rounded-2xl overflow-hidden shadow-cozy flex-shrink-0 border-2 border-[#341434]/8">
                      <img src={ep.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pr-16">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#4F2247]/70 font-semibold">
                      Ep. {String(ep.episode_number ?? i + 1).padStart(2, "0")}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#F0A6BF] text-[#341434] text-[11px] font-semibold tracking-wide uppercase">
                      {tagFor(ep.title)}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-[26px] font-semibold leading-tight text-[#1F1216] group-hover:text-[#4F2247] transition-colors pr-2">
                    {ep.title}
                  </h3>

                  <p className="text-[#341434]/75 leading-relaxed text-[15px] line-clamp-4">{ep.description}</p>

                  <div className="mt-auto pt-5 border-t border-[#341434]/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#4F2247] text-sm font-medium">
                      <Clock size={14} />
                      {formatDuration(ep.duration)}
                    </span>
                    <div className="flex items-center gap-2">
                      <EpisodeShare episode={ep} />
                      <span
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                          isPlaying
                            ? "bg-[#E0578F] text-[#F5E9D7]"
                            : "bg-[#341434] text-[#F5E9D7] group-hover:bg-[#E0578F]"
                        }`}
                      >
                        <Play size={16} className="ml-0.5" fill="currentColor" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-14 text-center reveal">
          <a
            href={SITE.spotify.showUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="all-episodes-cta"
            className="btn-press inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#F0A6BF] text-[#341434] font-semibold hover:bg-[#E0578F] hover:text-[#F5E9D7]"
          >
            See all episodes on Spotify →
          </a>
        </div>
      </div>
    </section>
  );
};
