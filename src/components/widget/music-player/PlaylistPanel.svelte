<script lang="ts">
  import Icon from "@iconify/svelte";
  import Key from "../../../i18n/i18nKey";
  import { i18n } from "../../../i18n/translation";
  import {
    getAssetPath,
    type Song,
  } from "../../../scripts/music-player/player-types";

  export let currentIndex = 0;
  export let isPlaying = false;
  export let panelElement: HTMLDivElement;
  export let playlist: Song[] = [];
  export let onPlaySong: (index: number) => void;
  export let onTogglePlaylist: () => void;

  function handleItemKeydown(event: KeyboardEvent, index: number) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onPlaySong(index);
  }
</script>

<div
  bind:this={panelElement}
  class="playlist-panel animate-slide-up float-panel fixed bottom-19 right-6 w-72 max-h-96 overflow-hidden z-50"
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
        on:click={onTogglePlaylist}
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
          on:click={() => onPlaySong(index)}
          on:keydown={(event) => handleItemKeydown(event, index)}
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
              <Icon icon="material-symbols:pause" class="text-(--primary)" />
            {:else}
              <span class="text-sm text-(--content-meta)">{index + 1}</span>
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
