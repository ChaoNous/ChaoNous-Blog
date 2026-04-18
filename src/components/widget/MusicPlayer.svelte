<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onMount } from "svelte";
  import { musicPlayerConfig } from "../../config";
  import Key from "../../i18n/i18nKey";
  import { i18n } from "../../i18n/translation";
  import { fetchMetingPlaylistSongs } from "../../scripts/music-player/player-meting";
  import {
    bindAutoplayRecovery,
    bindPlayerDocumentEvents,
    scheduleInitialPlaylistLoad,
  } from "../../scripts/music-player/player-runtime";
  import {
    createSong,
    getAssetPath,
    type Song,
  } from "../../scripts/music-player/player-types";

  let meting_api =
    musicPlayerConfig.meting_api ??
    "https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
  let meting_id = musicPlayerConfig.id ?? "14164869977";
  let meting_server = musicPlayerConfig.server ?? "netease";
  let meting_type = musicPlayerConfig.type ?? "playlist";

  let isPlaying = false;
  let isHidden = false;
  let showPlaylist = false;
  let currentTime = 0;
  let duration = 0;
  let isLoading = false;
  let isShuffled = false;
  let isRepeating = 2;
  let errorMessage = "";
  let showError = false;
  let autoplayFailed = false;
  let willAutoPlay = false;
  let playlistLoaded = false;

  let currentSong: Song = createSong({
    title: i18n(Key.musicPlayerLoading),
    artist: i18n(Key.unknownArtist),
  });
  let playlist: Song[] = [];
  let currentIndex = 0;

  let audio: HTMLAudioElement;
  let progressBar: HTMLElement;
  let playerRoot: HTMLDivElement;
  let playlistPanel: HTMLDivElement;

  async function fetchMetingPlaylist() {
    if (!meting_api || !meting_id) return;

    isLoading = true;
    try {
      playlist = await fetchMetingPlaylistSongs({
        apiTemplate: meting_api,
        id: meting_id,
        server: meting_server,
        type: meting_type,
        unknownSongLabel: i18n(Key.unknownSong),
        unknownArtistLabel: i18n(Key.unknownArtist),
      });

      if (playlist.length > 0) {
        loadSong(playlist[0]);
      } else {
        showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
      }
    } catch (_error) {
      showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
    } finally {
      isLoading = false;
    }
  }

  function lazyLoadPlaylist() {
    if (playlistLoaded) return;
    playlistLoaded = true;
    fetchMetingPlaylist();
  }

  function togglePlay() {
    if (!playlistLoaded) {
      lazyLoadPlaylist();
    }
    if (!audio || !currentSong.url) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    audio.play().catch(() => {});
  }

  function togglePlaylist() {
    if (!playlistLoaded) {
      lazyLoadPlaylist();
    }

    showPlaylist = !showPlaylist;
  }

  function toggleHidden() {
    isHidden = !isHidden;
    if (isHidden) {
      showPlaylist = false;
    }
  }

  function closePlaylist() {
    showPlaylist = false;
  }

  function toggleRepeat() {
    if (!isShuffled && isRepeating === 2) {
      isRepeating = 1;
      return;
    }

    if (!isShuffled && isRepeating === 1) {
      isShuffled = true;
      isRepeating = 2;
      return;
    }

    isShuffled = false;
    isRepeating = 2;
  }

  function previousSong() {
    if (playlist.length <= 1) return;

    const newIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    playSong(newIndex);
  }

  function nextSong(autoPlay = true) {
    if (playlist.length <= 1) return;

    let newIndex: number;
    if (isShuffled) {
      do {
        newIndex = Math.floor(Math.random() * playlist.length);
      } while (newIndex === currentIndex && playlist.length > 1);
    } else {
      newIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    }

    playSong(newIndex, autoPlay);
  }

  function playSong(index: number, autoPlay = true) {
    if (index < 0 || index >= playlist.length) return;

    willAutoPlay = autoPlay;
    currentIndex = index;
    loadSong(playlist[currentIndex]);
  }

  function loadSong(song: Song) {
    if (!song) return;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    currentSong = { ...song };
    currentTime = 0;
    duration = song.duration ?? 0;

    if (song.url) {
      isLoading = true;
      setTimeout(() => {
        if (audio) {
          audio.load();
        }
      }, 50);
      return;
    }

    isLoading = false;
  }

  function handleLoadSuccess() {
    isLoading = false;
    if (audio?.duration && audio.duration > 1) {
      duration = Math.floor(audio.duration);
      if (playlist[currentIndex]) {
        playlist[currentIndex].duration = duration;
      }
      currentSong.duration = duration;
    }

    if (willAutoPlay || isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Autoplay was blocked until user interaction.", error);
          autoplayFailed = true;
          isPlaying = false;
        });
      }
    }
  }

  function handleLoadError() {
    if (!currentSong.url) return;

    isLoading = false;
    showErrorMessage(
      `${i18n(Key.musicPlayerErrorSong)} - ${currentSong.title}`,
    );

    const shouldContinue = isPlaying || willAutoPlay;
    if (playlist.length > 1) {
      setTimeout(() => nextSong(shouldContinue), 1000);
      return;
    }

    showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
  }

  function handleAudioEnded() {
    if (isRepeating === 1) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }

    if (isRepeating === 2 || isShuffled) {
      nextSong(true);
      return;
    }

    isPlaying = false;
  }

  function showErrorMessage(message: string) {
    errorMessage = message;
    showError = true;
    setTimeout(() => {
      showError = false;
    }, 3000);
  }

  function hideError() {
    showError = false;
  }

  function setProgress(event: MouseEvent) {
    if (!audio || !progressBar || duration <= 0) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    currentTime = newTime;
  }

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  onMount(() => {
    const cleanups: Array<() => void> = [];
    const isMobileViewport =
      typeof window !== "undefined" && window.innerWidth < 768;
    isHidden = isMobileViewport;

    cleanups.push(
      bindAutoplayRecovery({
        getAudio: () => audio,
        shouldRecover: () => autoplayFailed,
        onRecovered: () => {
          autoplayFailed = false;
        },
      }),
    );

    cleanups.push(
      bindPlayerDocumentEvents({
        getPlayerRoot: () => playerRoot,
        getPlaylistPanel: () => playlistPanel,
        isPlaylistOpen: () => showPlaylist,
        closePlaylist,
      }),
    );

    scheduleInitialPlaylistLoad({
      enabled: musicPlayerConfig.enable,
      isMobileViewport,
      lazyLoadPlaylist,
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  });
</script>

<audio
  bind:this={audio}
  src={getAssetPath(currentSong.url)}
  on:play={() => (isPlaying = true)}
  on:pause={() => (isPlaying = false)}
  on:timeupdate={() => (currentTime = audio.currentTime)}
  on:ended={handleAudioEnded}
  on:error={handleLoadError}
  on:loadeddata={handleLoadSuccess}
  preload="none"
></audio>

{#if musicPlayerConfig.enable}
  {#if showError}
    <div class="fixed bottom-20 right-4 z-60 max-w-sm">
      <div
        class="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
      >
        <Icon icon="material-symbols:error" class="text-xl shrink-0" />
        <span class="text-sm flex-1">{errorMessage}</span>
        <button
          on:click={hideError}
          class="text-white/80 hover:text-white transition-colors"
        >
          <Icon icon="material-symbols:close" class="text-lg" />
        </button>
      </div>
    </div>
  {/if}

  <div
    bind:this={playerRoot}
    class="music-player fixed bottom-8 right-6 z-50 transition-all duration-300 ease-in-out"
    class:hidden-mode={isHidden}
  >
    <div
      class="orb-player rounded-xl flex items-center justify-center"
      class:opacity-0={!isHidden}
      class:scale-0={!isHidden}
      class:pointer-events-none={!isHidden}
      on:click={toggleHidden}
      on:keydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleHidden();
        }
      }}
      role="button"
      tabindex="0"
      aria-label={i18n(Key.musicPlayerShow)}
    >
      {#if isLoading}
        <Icon
          icon="eos-icons:loading"
          class="hidden-player-icon text-(--primary) text-3xl"
        />
      {:else if isPlaying}
        <div class="flex space-x-0.5">
          <div
            class="hidden-player-bar w-0.5 h-3 rounded-full animate-pulse"
          ></div>
          <div
            class="hidden-player-bar w-0.5 h-4 rounded-full animate-pulse"
            style="animation-delay: 150ms;"
          ></div>
          <div
            class="hidden-player-bar w-0.5 h-2 rounded-full animate-pulse"
            style="animation-delay: 300ms;"
          ></div>
        </div>
      {:else}
        <Icon
          icon="material-symbols:music-note"
          class="hidden-player-icon text-(--primary) text-3xl"
        />
      {/if}
    </div>

    <div
      class="expanded-player card-base rounded-2xl transition-all duration-500 ease-in-out overflow-hidden"
      style="background: var(--display-panel-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);"
      class:opacity-0={isHidden}
      class:scale-95={isHidden}
      class:pointer-events-none={isHidden}
    >
      <div
        class="expanded-player-surface p-4"
        style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit;"
      >
        <div class="flex items-center gap-4 mb-4">
          <div
            class="cover-container relative w-16 h-16 rounded-full overflow-hidden shrink-0 cursor-pointer"
            on:click={togglePlay}
            on:keydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePlay();
              }
            }}
            role="button"
            tabindex="0"
            aria-label={isPlaying
              ? i18n(Key.musicPlayerPause)
              : i18n(Key.musicPlayerPlay)}
          >
            {#if currentSong.cover}
              <img
                src={getAssetPath(currentSong.cover)}
                alt={i18n(Key.musicPlayerCover)}
                class="w-full h-full object-cover transition-transform duration-300"
                class:spinning={isPlaying && !isLoading}
                class:animate-pulse={isLoading}
              />
            {:else}
              <div
                class="w-full h-full flex items-center justify-center bg-(--btn-regular-bg) text-(--primary)"
              >
                <Icon icon="material-symbols:album-outline" class="text-2xl" />
              </div>
            {/if}
          </div>

          <div class="flex-1 min-w-0">
            <div class="song-title text-lg font-bold text-90 truncate mb-1">
              {currentSong.title}
            </div>
            <div class="song-artist text-sm text-50 truncate">
              {currentSong.artist}
            </div>
            <div class="text-xs text-30 mt-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
              aria-label={i18n(Key.musicPlayerHide)}
              on:click={toggleHidden}
              title={i18n(Key.musicPlayerHide)}
            >
              <Icon icon="material-symbols:visibility-off" class="text-lg" />
            </button>
          </div>

        </div>

        <div class="progress-section mb-4">
          <div
            class="progress-bar flex-1 h-2 bg-(--btn-regular-bg) rounded-full cursor-pointer"
            bind:this={progressBar}
            on:click={setProgress}
            on:keydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const percent = 0.5;
                const newTime = percent * duration;
                if (audio) {
                  audio.currentTime = newTime;
                  currentTime = newTime;
                }
              }
            }}
            role="slider"
            tabindex="0"
            aria-label={i18n(Key.musicPlayerProgress)}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={duration > 0 ? (currentTime / duration) * 100 : 0}
          >
            <div
              class="h-full bg-(--primary) rounded-full transition-all duration-100"
              style="width: {duration > 0
                ? (currentTime / duration) * 100
                : 0}%"
            ></div>
          </div>
        </div>

        <div class="controls flex items-center justify-center gap-2">
          <button
            class="btn-plain w-10 h-10 rounded-lg"
            aria-label={isShuffled
              ? i18n(Key.musicPlayerShuffle)
              : isRepeating === 1
                ? i18n(Key.musicPlayerRepeatOne)
                : i18n(Key.musicPlayerRepeat)}
            on:click|stopPropagation={toggleRepeat}
          >
            {#if isShuffled}
              <Icon icon="material-symbols:shuffle" class="text-lg" />
            {:else if isRepeating === 1}
              <Icon icon="material-symbols:repeat-one" class="text-lg" />
            {:else}
              <Icon icon="material-symbols:repeat" class="text-lg" />
            {/if}
          </button>

          <button
            class="btn-plain w-10 h-10 rounded-lg"
            on:click={previousSong}
            aria-label={i18n(Key.musicPlayerPrevious)}
            disabled={playlist.length <= 1}
          >
            <Icon icon="material-symbols:skip-previous" class="text-xl" />
          </button>

          <button
            class="btn-plain w-10 h-10 rounded-lg"
            aria-label={isPlaying
              ? i18n(Key.musicPlayerPause)
              : i18n(Key.musicPlayerPlay)}
            class:opacity-50={isLoading}
            disabled={isLoading}
            on:click|stopPropagation={togglePlay}
          >
            {#if isLoading}
              <Icon icon="eos-icons:loading" class="text-xl" />
            {:else if isPlaying}
              <Icon icon="material-symbols:pause" class="text-xl" />
            {:else}
              <Icon icon="material-symbols:play-arrow" class="text-xl" />
            {/if}
          </button>

          <button
            class="btn-plain w-10 h-10 rounded-lg"
            aria-label={i18n(Key.musicPlayerNext)}
            on:click={() => nextSong()}
            disabled={playlist.length <= 1}
          >
            <Icon icon="material-symbols:skip-next" class="text-xl" />
          </button>

          <button
            class="btn-plain w-10 h-10 rounded-lg flex items-center justify-center"
            aria-label={i18n(Key.musicPlayerPlaylist)}
            class:text-[var(--primary)]={showPlaylist}
            on:click={togglePlaylist}
            title={i18n(Key.musicPlayerPlaylist)}
          >
            <Icon icon="material-symbols:queue-music" class="text-lg" />
          </button>
        </div>
      </div>
    </div>

    {#if showPlaylist}
      <div
        bind:this={playlistPanel}
        class="playlist-panel animate-slide-up float-panel fixed bottom-20 right-6 w-80 max-h-96 overflow-hidden z-50"
        style="background: var(--display-panel-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); border-radius: var(--radius-large);"
      >
        <div
          class="playlist-panel-surface"
          style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit; overflow: hidden;"
        >
          <div
            class="playlist-header flex items-center justify-between p-4 border-b border-(--line-divider)"
          >
            <h3 class="text-lg font-semibold text-90">
              {i18n(Key.musicPlayerPlaylist)}
            </h3>
            <button
              class="btn-plain w-8 h-8 rounded-lg"
              aria-label={i18n(Key.musicPlayerPlaylist)}
              on:click={togglePlaylist}
            >
              <Icon icon="material-symbols:close" class="text-lg" />
            </button>
          </div>

          <div class="playlist-content overflow-y-auto max-h-80 hide-scrollbar">
            {#each playlist as song, index}
              <div
                class="playlist-item flex items-center gap-3 p-3 hover:bg-(--btn-plain-bg-hover) cursor-pointer transition-colors"
                class:bg-[var(--btn-plain-bg)]={index === currentIndex}
                class:text-[var(--primary)]={index === currentIndex}
                on:click={() => playSong(index)}
                on:keydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playSong(index);
                  }
                }}
                role="button"
                tabindex="0"
                aria-label={`Play ${song.title} - ${song.artist}`}
              >
                <div class="w-6 h-6 flex items-center justify-center">
                  {#if index === currentIndex && isPlaying}
                    <Icon
                      icon="material-symbols:graphic-eq"
                      class="text-(--primary) animate-pulse"
                    />
                  {:else if index === currentIndex}
                    <Icon
                      icon="material-symbols:pause"
                      class="text-(--primary)"
                    />
                  {:else}
                    <span class="text-sm text-(--content-meta)"
                      >{index + 1}</span
                    >
                  {/if}
                </div>

                <div
                  class="w-10 h-10 rounded-lg overflow-hidden bg-(--btn-regular-bg) shrink-0"
                >
                  <img
                    src={getAssetPath(song.cover)}
                    alt={song.title}
                    loading="lazy"
                    class="w-full h-full object-cover"
                  />
                </div>

                <div class="flex-1 min-w-0">
                  <div
                    class="font-medium truncate"
                    class:text-[var(--primary)]={index === currentIndex}
                    class:text-90={index !== currentIndex}
                  >
                    {song.title}
                  </div>
                  <div
                    class="text-sm text-(--content-meta) truncate"
                    class:text-[var(--primary)]={index === currentIndex}
                  >
                    {song.artist}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <style>
    @import "../../styles/music-player.css";
  </style>
{/if}
