export type MusicApiErrorCode =
  | "BAD_REQUEST"
  | "UNSUPPORTED_SOURCE"
  | "UPSTREAM_ERROR";

export type SupportedMusicServer = "netease";
export type SupportedMusicResourceType = "playlist";

export type MusicPlaylistRequest = {
  server: SupportedMusicServer;
  type: SupportedMusicResourceType;
  playlistId: string;
};

export type MusicTrack = {
  id: number;
  name: string;
  artist: string;
  author: string;
  pic: string;
  url: string;
  duration: number;
};

export type MusicRequestErrorCode = Extract<
  MusicApiErrorCode,
  "BAD_REQUEST" | "UNSUPPORTED_SOURCE"
>;

export type MusicRequestError = {
  status: number;
  code: MusicRequestErrorCode;
  message: string;
};
