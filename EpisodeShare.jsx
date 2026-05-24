import { useEffect, useRef, useState } from "react";
import { Share2, Copy, Check, X, ExternalLink } from "lucide-react";

function buildPostText(episode) {
  const base = `just listened to "${episode.title}" on @awkwardishpodcast ✿`;
  const tag = "#Awkwardish #podcast #mentalhealth";
  const link = episode.spotify_url || "https://open.spotify.com/show/0UChrcN9cdZc8ahsFmh7t5";
  return `${base}\n\n${link}\n\n${tag}`;
}

export function EpisodeShare({ episode }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef(null);
  const btnRef = useRef(null);

  const postText = buildPostText(episode);
  const spotifyUrl = episode.spotify_url || "https://open.spotify.com/show/0UChrcN9cdZc8ahsFmh7t5";

  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (canNativeShare) {
      navigator.share({
        title: episode.title,
        text: postText,
        url: spotifyUrl,
      }).catch(() => {});
      return;
    }

    setOpen((o) => !o);
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback: select the textarea
      const ta = popoverRef.current?.querySelector("textarea");
      if (ta) { ta.select(); document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    }
  };

  const tweetUrl =
    "https://twitter.com/intent/tweet?text=" + encodeURIComponent(postText);

  const threadsUrl =
    "https://www.threads.net/intent/post?text=" + encodeURIComponent(postText);

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <button
        ref={btnRef}
        onClick={handleShare}
        data-testid="episode-share-btn"
        aria-label="Share episode"
        className="w-8 h-8 rounded-full bg-[#341434]/8 hover:bg-[#341434]/15 text-[#4F2247] flex items-center justify-center transition-colors"
      >
        <Share2 size={14} />
      </button>

      {open && !canNativeShare && (
        <div
          ref={popoverRef}
          data-testid="episode-share-popover"
          className="absolute bottom-10 right-0 z-40 w-80 bg-[#F5E9D7] rounded-[24px] shadow-cozy-lg border border-[#341434]/12 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-[#1F1216] text-base">Share this episode</p>
            <button
              onClick={() => setOpen(false)}
              className="text-[#341434]/40 hover:text-[#341434] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Pre-written post text */}
          <textarea
            readOnly
            value={postText}
            rows={5}
            className="w-full text-xs text-[#341434]/80 bg-[#341434]/5 border border-[#341434]/12 rounded-2xl p-3 resize-none leading-relaxed font-body focus:outline-none"
            onClick={(e) => e.target.select()}
          />

          {/* Copy button */}
          <button
            onClick={handleCopy}
            data-testid="episode-share-copy"
            className="btn-press mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#341434] text-[#F5E9D7] text-sm font-semibold hover:bg-[#4F2247] transition-colors"
          >
            {copied ? (
              <><Check size={14} className="text-[#A8E6A3]" />Copied!</>
            ) : (
              <><Copy size={14} />Copy text</>
            )}
          </button>

          {/* Social quick-share */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="episode-share-twitter"
              className="btn-press inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] text-xs font-semibold hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={11} />
              Post on X
            </a>
            <a
              href={threadsUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="episode-share-threads"
              className="btn-press inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#341434]/8 text-[#341434] text-xs font-semibold hover:bg-[#341434]/15 border border-[#341434]/12 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={11} />
              Post on Threads
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
