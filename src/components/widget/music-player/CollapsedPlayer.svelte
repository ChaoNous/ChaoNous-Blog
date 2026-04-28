<script lang="ts">
  import Icon from "@iconify/svelte";
  import Key from "../../../i18n/i18nKey";
  import { i18n } from "../../../i18n/translation";

  export let isHidden = false;
  export let isLoading = false;
  export let isPlaying = false;
  export let onToggleHidden: () => void;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onToggleHidden();
  }
</script>

<div
  class="orb-player rounded-xl flex items-center justify-center"
  class:opacity-0={!isHidden}
  class:scale-0={!isHidden}
  class:pointer-events-none={!isHidden}
  on:click={onToggleHidden}
  on:keydown={handleKeydown}
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
      <div class="hidden-player-bar w-0.5 h-3 rounded-full animate-pulse"></div>
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
