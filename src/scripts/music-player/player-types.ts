export type Song = {
  id: number;
  title: string;
  artist: string;
  cover: string;
  url: string;
  duration: number;
};

function normalizeCover(cover: unknown): string {
  if (typeof cover === "string") return cover;
  if (cover && typeof cover === "object" && "src" in cover) {
    const src = (cover as { src?: unknown }).src;
    return typeof src === "string" ? src : "";
  }
  return "";
}

export function createSong(
  data: Partial<Song> & { title: string; artist: string },
): Song {
  return {
    id: data.id ?? 0,
    title: data.title,
    artist: data.artist,
    cover: normalizeCover(data.cover),
    url: data.url ?? "",
    duration: data.duration ?? 0,
  };
}

export function getAssetPath(path: string | undefined | null): string {
  if (!path || typeof path !== "string") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) return path;
  return `/${path}`;
}
