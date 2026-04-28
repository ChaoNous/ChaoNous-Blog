<script lang="ts">
  import Icon from "@iconify/svelte";
  import Key from "../../../i18n/i18nKey";
  import { i18n } from "../../../i18n/translation";
  import { formatTime } from "../../../scripts/music-player/player-format";
  import {
    getAssetPath,
    type Song,
  } from "../../../scripts/music-player/player-types";

  export let currentSong: Song;
  export let currentTime = 0;
  export let duration = 0;
  export let isHidden = false;
  export let isLoading = false;
  export let isPlaying = false;
  export let isRepeating = 2;
  export let isShuffled = false;
  export let playlistLength = 0;
  export let showPlaylist = false;
  export let onNextSong: () => void;
  export let onPreviousSong: () => void;
  export let onSeekPercent: (percent: number) => void;
  export let onToggleHidden: () => void;
  export let onTogglePlay: () => void;
  export let onTogglePlaylist: () => void;
  export let onToggleRepeat: () => void;

  let progressBar: HTMLElement;

  $: progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  function handleCoverKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onTogglePlay();
  }

  function handleProgressClick(event: MouseEvent) {
    if (!progressBar || duration <= 0) {
      return;
    }

    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    onSeekPercent(Math.min(1, Math.max(0, percent)));
  }

  function handleProgressKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onSeekPercent(0.5);
  }
</script>

<div
  class="expanded-player card-base rounded-2xl transition-all duration-500 ease-in-out overflow-hidden"
  style="background: var(--display-panel-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);"
  class:opacity-0={isHidden}
  class:scale-95={isHidden}
  class:pointer-events-none={isHidden}
>
  <div
    class="expanded-player-surface p-3"
    style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit;"
  >
    <div class="flex items-center gap-3 mb-3">
      <div
        class="cover-container relative w-13 h-13 rounded-full overflow-hidden shrink-0 cursor-pointer"
        on:click={onTogglePlay}
        on:keydown={handleCoverKeydown}
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
        <div class="song-title text-base font-bold text-90 truncate mb-0.5">
          {currentSong.title}
        </div>
        <div class="song-artist text-sm text-50 truncate">
          {currentSong.artist}
        </div>
        <div class="text-[0.7rem] text-30 mt-0.5">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          class="btn-plain w-7 h-7 rounded-lg flex items-center justify-center"
          aria-label={i18n(Key.musicPlayerHide)}
          on:click={onToggleHidden}
          title={i18n(Key.musicPlayerHide)}
        >
          <Icon icon="material-symbols:visibility-off" class="text-base" />
        </button>
      </div>
    </div>

    <div class="progress-section mb-3">
      <div
        class="progress-bar flex-1 h-1.5 bg-(--btn-regular-bg) rounded-full cursor-pointer"
        bind:this={progressBar}
        on:click={handleProgressClick}
        on:keydown={handleProgressKeydown}
        role="slider"
        tabindex="0"
        aria-label={i18n(Key.musicPlayerProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progressPercent}
      >
        <div
          class="h-full bg-(--primary) rounded-full transition-all duration-100"
          style="width: {progressPercent}%"
        ></div>
      </div>
    </div>

    <div class="controls flex items-center justify-between gap-0.5 px-1">
      <button
        class="btn-plain w-9 h-9 rounded-lg shrink-0"
        aria-label={isShuffled
          ? i18n(Key.musicPlayerShuffle)
          : isRepeating === 1
            ? i18n(Key.musicPlayerRepeatOne)
            : i18n(Key.musicPlayerRepeat)}
        on:click|stopPropagation={onToggleRepeat}
      >
        {#if isShuffled}
          <Icon icon="material-symbols:shuffle" class="text-[1.05rem]" />
        {:else if isRepeating === 1}
          <Icon icon="material-symbols:repeat-one" class="text-[1.05rem]" />
        {:else}
          <Icon icon="material-symbols:repeat" class="text-[1.05rem]" />
        {/if}
      </button>

      <button
        class="btn-plain w-9 h-9 rounded-lg shrink-0"
        on:click={onPreviousSong}
        aria-label={i18n(Key.musicPlayerPrevious)}
        disabled={playlistLength <= 1}
      >
        <Icon icon="material-symbols:skip-previous" class="text-lg" />
      </button>

      <button
        class="btn-plain w-9 h-9 rounded-lg shrink-0"
        aria-label={isPlaying
          ? i18n(Key.musicPlayerPause)
          : i18n(Key.musicPlayerPlay)}
        class:opacity-50={isLoading}
        disabled={isLoading}
        on:click|stopPropagation={onTogglePlay}
      >
        {#if isLoading}
          <Icon icon="eos-icons:loading" class="text-lg" />
        {:else if isPlaying}
          <Icon icon="material-symbols:pause" class="text-lg" />
        {:else}
          <Icon icon="material-symbols:play-arrow" class="text-lg" />
        {/if}
      </button>

      <button
        class="btn-plain w-9 h-9 rounded-lg shrink-0"
        aria-label={i18n(Key.musicPlayerNext)}
        on:click={onNextSong}
        disabled={playlistLength <= 1}
      >
        <Icon icon="material-symbols:skip-next" class="text-lg" />
      </button>

      <button
        class="btn-plain w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        aria-label={i18n(Key.musicPlayerPlaylist)}
        class:text-[var(--primary)]={showPlaylist}
        on:click={onTogglePlaylist}
        title={i18n(Key.musicPlayerPlaylist)}
      >
        <Icon icon="material-symbols:queue-music" class="text-base" />
      </button>
    </div>
  </div>
</div>
