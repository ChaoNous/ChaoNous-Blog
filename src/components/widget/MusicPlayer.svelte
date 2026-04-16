<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onDestroy, onMount, tick } from "svelte";
  import { musicPlayerConfig } from "../../config";
  import hitoriCover from "../../assets/music/cover/hitori.webp";
  import Key from "../../i18n/i18nKey";
  import { i18n } from "../../i18n/translation";
  import {
    buildLocalPlaylist,
    getLoadingSong as getInitialLoadingSong,
  } from "../../scripts/music-player/player-local";
  import { fetchMetingPlaylistSongs } from "../../scripts/music-player/player-meting";
  import {
    cacheInitialSong,
    restoreCachedInitialSong,
  } from "../../scripts/music-player/player-storage";
  import {
    getAssetPath,
    type Song,
  } from "../../scripts/music-player/player-types";

  let mode = musicPlayerConfig.mode ?? "meting";
  let metingApi =
    musicPlayerConfig.meting_api ??
    "https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
  let metingId = musicPlayerConfig.id ?? "14164869977";
  let metingServer = musicPlayerConfig.server ?? "netease";
  let metingType = musicPlayerConfig.type ?? "playlist";

  const localPlaylist: Song[] = buildLocalPlaylist(hitoriCover);

  let playlist: Song[] = [];
  let currentIndex = 0;
  let currentSong: Song = getInitialLoadingSong(
    mode,
    localPlaylist,
    i18n(Key.musicPlayerLoading),
    i18n(Key.unknownArtist),
  );

  let audio: HTMLAudioElement | null = null;
  let isLoading = false;
  let isPlaying = false;
  let playlistLoaded = false;
  let pendingAutoplay = false;
  let isCollapsed = false;
  let showError = false;
  let errorMessage = "";
  let errorTimer: number | undefined;

  function getCoverUrl(song: Song): string {
    return getAssetPath(song.cover) || hitoriCover;
  }

  function clearErrorTimer() {
    if (errorTimer) {
      window.clearTimeout(errorTimer);
      errorTimer = undefined;
    }
  }

  function showErrorMessage(message: string) {
    errorMessage = message;
    showError = true;
    clearErrorTimer();
    errorTimer = window.setTimeout(() => {
      showError = false;
    }, 2800);
  }

  function restoreInitialSong() {
    const cachedSong = restoreCachedInitialSong(mode);
    if (cachedSong) {
      currentSong = cachedSong;
    }
  }

  function syncAudioVolume() {
    if (audio) {
      audio.volume = 0.7;
    }
  }

  async function syncCurrentSong(autoplay = false) {
    pendingAutoplay = autoplay;
    if (!currentSong.url) {
      isLoading = false;
      return;
    }

    isLoading = true;
    await tick();

    if (!audio) {
      isLoading = false;
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    syncAudioVolume();
    audio.load();
  }

  async function initializePlaylist(songs: Song[]) {
    playlist = songs;
    playlistLoaded = true;

    if (!playlist.length) {
      isLoading = false;
      showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
      return;
    }

    const cachedIndex = playlist.findIndex(
      (song) => currentSong.id > 0 && song.id === currentSong.id,
    );
    currentIndex = cachedIndex >= 0 ? cachedIndex : 0;
    currentSong = { ...playlist[currentIndex] };

    if (mode === "meting") {
      cacheInitialSong(mode, playlist[0]);
    }

    await syncCurrentSong(false);
  }

  async function loadPlaylist() {
    if (playlistLoaded || isLoading) {
      return;
    }

    if (mode === "local") {
      await initializePlaylist(localPlaylist);
      return;
    }

    isLoading = true;

    try {
      const songs = await fetchMetingPlaylistSongs({
        apiTemplate: metingApi,
        id: metingId,
        server: metingServer,
        type: metingType,
        unknownSongLabel: i18n(Key.unknownSong),
        unknownArtistLabel: i18n(Key.unknownArtist),
      });
      await initializePlaylist(songs);
    } catch {
      isLoading = false;
      showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
    }
  }

  async function playSong(index: number, autoplay = true) {
    if (index < 0 || index >= playlist.length) {
      return;
    }

    currentIndex = index;
    currentSong = { ...playlist[index] };
    await syncCurrentSong(autoplay);
  }

  async function previousSong() {
    await loadPlaylist();
    if (playlist.length <= 1) {
      return;
    }

    const nextIndex =
      currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    await playSong(nextIndex, isPlaying);
  }

  async function nextSong(autoplay = isPlaying) {
    await loadPlaylist();
    if (playlist.length <= 1) {
      return;
    }

    const nextIndex =
      currentIndex >= playlist.length - 1 ? 0 : currentIndex + 1;
    await playSong(nextIndex, autoplay);
  }

  async function togglePlay() {
    await loadPlaylist();

    if (!audio || !currentSong.url) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      pendingAutoplay = false;
      showErrorMessage(i18n(Key.musicPlayerErrorSong));
    }
  }

  function toggleCollapsed() {
    isCollapsed = !isCollapsed;
  }

  function handleCanPlay() {
    isLoading = false;
    syncAudioVolume();

    if (!pendingAutoplay || !audio) {
      return;
    }

    pendingAutoplay = false;
    audio.play().catch(() => {
      isPlaying = false;
      showErrorMessage(i18n(Key.musicPlayerErrorSong));
    });
  }

  function handleEnded() {
    if (playlist.length > 1) {
      void nextSong(true);
      return;
    }

    isPlaying = false;
  }

  function handleAudioError() {
    isLoading = false;
    pendingAutoplay = false;
    showErrorMessage(
      `${i18n(Key.musicPlayerErrorSong)} - ${currentSong.title}`,
    );

    if (playlist.length > 1) {
      window.setTimeout(() => {
        void nextSong(isPlaying);
      }, 800);
    }
  }

  onMount(() => {
    restoreInitialSong();

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
    ) {
      isCollapsed = true;
    }

    const scheduleLoad = () => {
      void loadPlaylist();
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(scheduleLoad, { timeout: 1500 });
    } else {
      window.setTimeout(scheduleLoad, 800);
    }
  });

  onDestroy(() => {
    clearErrorTimer();
  });
</script>

{#if musicPlayerConfig.enable}
  <div class="music-player-shell" class:is-collapsed={isCollapsed}>
    <audio
      bind:this={audio}
      preload="none"
      src={getAssetPath(currentSong.url)}
      on:play={() => (isPlaying = true)}
      on:pause={() => (isPlaying = false)}
      on:canplay={handleCanPlay}
      on:ended={handleEnded}
      on:error={handleAudioError}
    ></audio>

    {#if isCollapsed}
      <button
        type="button"
        class="music-player-dock"
        aria-label={i18n(Key.musicPlayerShow)}
        title={i18n(Key.musicPlayerShow)}
        on:click={toggleCollapsed}
      >
        {#if isLoading}
          <Icon icon="eos-icons:loading" class="text-xl" />
        {:else if isPlaying}
          <Icon icon="material-symbols:pause" class="text-xl" />
        {:else}
          <Icon icon="material-symbols:play-arrow" class="text-2xl" />
        {/if}
      </button>
    {:else}
      <section class="music-player-card" aria-label={i18n(Key.musicPlayer)}>
        <button
          type="button"
          class="music-player-close"
          aria-label={i18n(Key.musicPlayerCollapse)}
          title={i18n(Key.musicPlayerCollapse)}
          on:click={toggleCollapsed}
        >
          <Icon icon="material-symbols:close" class="text-lg" />
        </button>

        <div class="music-player-body">
          <div class="music-player-cover">
            <img
              src={getCoverUrl(currentSong)}
              alt={i18n(Key.musicPlayerCover)}
              loading="lazy"
              class:spinning={isPlaying && !isLoading}
            />
          </div>

          <div class="music-player-meta">
            <p class="music-player-title">{currentSong.title}</p>
            <p class="music-player-artist">{currentSong.artist}</p>
          </div>
        </div>

        <div class="music-player-controls">
          <button
            type="button"
            class="music-player-button"
            aria-label={i18n(Key.musicPlayerPrevious)}
            disabled={playlist.length <= 1 || isLoading}
            on:click={() => void previousSong()}
          >
            <Icon icon="material-symbols:skip-previous" class="text-xl" />
          </button>

          <button
            type="button"
            class="music-player-button music-player-button-primary"
            aria-label={isPlaying
              ? i18n(Key.musicPlayerPause)
              : i18n(Key.musicPlayerPlay)}
            disabled={isLoading && playlist.length === 0}
            on:click={() => void togglePlay()}
          >
            {#if isLoading}
              <Icon icon="eos-icons:loading" class="text-xl" />
            {:else if isPlaying}
              <Icon icon="material-symbols:pause" class="text-xl" />
            {:else}
              <Icon icon="material-symbols:play-arrow" class="text-2xl" />
            {/if}
          </button>

          <button
            type="button"
            class="music-player-button"
            aria-label={i18n(Key.musicPlayerNext)}
            disabled={playlist.length <= 1 || isLoading}
            on:click={() => void nextSong()}
          >
            <Icon icon="material-symbols:skip-next" class="text-xl" />
          </button>
        </div>
      </section>
    {/if}

    {#if showError}
      <div class="music-player-toast">{errorMessage}</div>
    {/if}
  </div>
{/if}

<style>
  .music-player-shell {
    position: fixed;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 45;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .music-player-card,
  .music-player-dock,
  .music-player-toast {
    border: 1px solid color-mix(in oklch, var(--line-divider) 88%, white);
    background: color-mix(in oklch, var(--card-bg) 90%, white);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  }

  .music-player-card {
    position: relative;
    width: min(19rem, calc(100vw - 2.5rem));
    padding: 1rem;
    border-radius: 1.25rem;
  }

  .music-player-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition:
      background-color 160ms ease,
      color 160ms ease;
  }

  .music-player-close:hover {
    background: var(--btn-plain-bg-hover);
    color: var(--text-main);
  }

  .music-player-body {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    min-width: 0;
    padding-right: 2rem;
  }

  .music-player-cover {
    width: 3.25rem;
    height: 3.25rem;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 1rem;
    background: var(--btn-regular-bg);
  }

  .music-player-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .music-player-cover img.spinning {
    animation: music-player-rotate 12s linear infinite;
  }

  .music-player-meta {
    min-width: 0;
  }

  .music-player-title,
  .music-player-artist {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .music-player-title {
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .music-player-artist {
    margin-top: 0.3rem;
    font-size: 0.86rem;
    color: var(--text-secondary);
  }

  .music-player-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.625rem;
    margin-top: 0.9rem;
  }

  .music-player-button,
  .music-player-dock {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    color: var(--text-main);
    cursor: pointer;
    transition:
      transform 160ms ease,
      background-color 160ms ease,
      opacity 160ms ease;
  }

  .music-player-button {
    height: 2.8rem;
    border-radius: 0.95rem;
    background: var(--btn-regular-bg);
  }

  .music-player-button:hover:not(:disabled),
  .music-player-dock:hover {
    transform: translateY(-1px);
    background: var(--btn-regular-bg-hover);
  }

  .music-player-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .music-player-button-primary {
    background: color-mix(in oklch, var(--primary) 88%, white);
    color: white;
  }

  .music-player-button-primary:hover:not(:disabled) {
    background: color-mix(in oklch, var(--primary) 94%, white);
  }

  .music-player-dock {
    width: 3.4rem;
    height: 3.4rem;
    border-radius: 999px;
  }

  .music-player-toast {
    max-width: min(20rem, calc(100vw - 2.5rem));
    padding: 0.75rem 0.95rem;
    border-radius: 1rem;
    color: var(--text-main);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  @keyframes music-player-rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .music-player-shell {
      right: 0.9rem;
      bottom: 0.9rem;
    }

    .music-player-card {
      width: min(17rem, calc(100vw - 1.8rem));
      padding: 0.9rem;
    }

    .music-player-dock {
      width: 3.15rem;
      height: 3.15rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .music-player-cover img.spinning,
    .music-player-button,
    .music-player-dock {
      animation: none !important;
      transition: none;
    }
  }
</style>
