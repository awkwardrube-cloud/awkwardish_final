import { createContext, useContext, useState, useCallback } from "react";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentEpisode, setCurrentEpisode] = useState(null);

  const play = useCallback((episode) => {
    setCurrentEpisode(episode);
  }, []);

  const close = useCallback(() => {
    setCurrentEpisode(null);
  }, []);

  return (
    <PlayerContext.Provider value={{ currentEpisode, play, close }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
