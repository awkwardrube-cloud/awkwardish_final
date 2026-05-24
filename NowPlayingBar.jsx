import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import { Play, Pause, X, Volume2, VolumeX, ExternalLink } from "lucide-react";

function formatTime(secs) {
  if (!isFinite(secs) || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function NowPlayingBar() {
  const { currentEpisode, close } = usePlayer();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (currentEpisode) {
      setVisible(false);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      setPlaying(false);
    }
  }, [currentEpisode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode?.audio_url) return;

    audio.src = currentEpisode.audio_url;
    audio.load();
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [currentEpisode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const v = parseFloat(e.target.value);
    audio.volume = v;
    setVolume(v);
    if (v > 0 && muted) { audio.muted = false; setMuted(false); }
  };

  const handleClose = () => {
    audioRef.current?.pause();
    close();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentEpisode) return <audio ref={audioRef} />;

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      <div
        data-testid="now-playing-bar"
        className={`fixed bottom-0 inset-x-0 z-50 transition-transform duration-500 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Progress bar — sits flush at the very top of the bar */}
        <div
          className="relative h-1 bg-[#4F2247]/40 cursor-pointer group"
          onClick={seek}
          data-testid="player-seek-bar"
        >
          <div
            className="h-full bg-[#E0578F] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E0578F] border-2 border-[#F5E9D7] shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        <div className="bg-[#1F1216]/95 backdrop-blur-xl border-t border-[#F5E9D7]/8 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">

            {/* Artwork */}
            {currentEpisode.image_url && (
              <div className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow">
                <img src={currentEpisode.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-[#F5E9D7] text-sm font-semibold truncate leading-tight">
                {currentEpisode.title}
              </p>
              <p className="text-[#F5E9D7]/50 text-xs mt-0.5">
                {formatTime(currentTime)}
                {duration > 0 && <> · {formatTime(duration)}</>}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                data-testid="player-play-pause"
                className="w-10 h-10 rounded-full bg-[#E0578F] text-white flex items-center justify-center hover:bg-[#F0A6BF] hover:text-[#341434] transition-colors shadow"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing
                  ? <Pause size={17} fill="currentColor" />
                  : <Play size={17} fill="currentColor" className="ml-0.5" />}
              </button>

              {/* Volume — hidden on small screens */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  data-testid="player-mute"
                  className="text-[#F5E9D7]/60 hover:text-[#F5E9D7] transition-colors"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={changeVolume}
                  data-testid="player-volume"
                  className="w-20 accent-[#E0578F] cursor-pointer"
                  aria-label="Volume"
                />
              </div>

              {/* Open in Spotify */}
              {currentEpisode.spotify_url && (
                <a
                  href={currentEpisode.spotify_url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="player-spotify-link"
                  className="text-[#F5E9D7]/50 hover:text-[#1DB954] transition-colors"
                  aria-label="Open in Spotify"
                  title="Open in Spotify"
                >
                  <ExternalLink size={15} />
                </a>
              )}

              {/* Close */}
              <button
                onClick={handleClose}
                data-testid="player-close"
                className="text-[#F5E9D7]/40 hover:text-[#F5E9D7] transition-colors"
                aria-label="Close player"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
