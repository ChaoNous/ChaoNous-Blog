import { createSong, type Song } from "./player-types";

const STORAGE_KEY_VOLUME = "music-player-volume";
const STORAGE_KEY_INITIAL_SONG = "music-player-initial-song";

export function loadStoredVolume(fallback = 0.7): number {
  try {
    if (typeof localStorage !== "undefined") {
      const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
      if (savedVolume !== null && !isNaN(parseFloat(savedVolume))) {
        return parseFloat(savedVolume);
      }
    }
  } catch (error) {
    console.warn("Failed to load volume settings from localStorage:", error);
  }

  return fallback;
}

export function saveStoredVolume(volume: number): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    }
  } catch (error) {
    console.warn("Failed to save volume settings to localStorage:", error);
  }
}

export function restoreCachedInitialSong(mode: string): Song | null {
  if (mode !== "meting" || typeof localStorage === "undefined") return null;

  try {
    const cached = localStorage.getItem(STORAGE_KEY_INITIAL_SONG);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as Partial<Song>;
    if (typeof parsed.title !== "string" || typeof parsed.artist !== "string") {
      return null;
    }

    return createSong({
      id: parsed.id,
      title: parsed.title,
      artist: parsed.artist,
      cover: parsed.cover,
      url: parsed.url,
      duration: parsed.duration,
    });
  } catch (error) {
    console.warn("Failed to restore cached initial song:", error);
    return null;
  }
}

export function cacheInitialSong(mode: string, song: Song): void {
  if (mode !== "meting" || typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEY_INITIAL_SONG,
      JSON.stringify({
        id: song.id,
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        url: song.url,
        duration: song.duration,
      }),
    );
  } catch (error) {
    console.warn("Failed to cache initial song:", error);
  }
}
