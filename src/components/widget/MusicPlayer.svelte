<script lang="ts">
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
  import CollapsedPlayer from "./music-player/CollapsedPlayer.svelte";
  import ErrorToast from "./music-player/ErrorToast.svelte";
  import ExpandedPlayer from "./music-player/ExpandedPlayer.svelte";
  import PlaylistPanel from "./music-player/PlaylistPanel.svelte";

  const metingApi =
    musicPlayerConfig.meting_api ??
    "https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
  const metingId = musicPlayerConfig.id ?? "14164869977";
  const metingServer = musicPlayerConfig.server ?? "netease";
  const metingType = musicPlayerConfig.type ?? "playlist";

  let audio: HTMLAudioElement;
  let playerRoot: HTMLDivElement;
  let playlistPanel: HTMLDivElement;

  let autoplayFailed = false;
  let currentIndex = 0;
  let currentSong: Song = createSong({
    title: i18n(Key.musicPlayerLoading),
    artist: i18n(Key.unknownArtist),
  });
  let currentTime = 0;
  let duration = 0;
  let errorMessage = "";
  let isHidden = false;
  let isLoading = false;
  let isPlaying = false;
  let isRepeating = 2;
  let isShuffled = false;
  let playlist: Song[] = [];
  let playlistLoaded = false;
  let showError = false;
  let showPlaylist = false;
  let willAutoPlay = false;

  async function fetchMetingPlaylist() {
    if (!metingApi || !metingId) return;

    isLoading = true;
    try {
      playlist = await fetchMetingPlaylistSongs({
        apiTemplate: metingApi,
        id: metingId,
        server: metingServer,
        type: metingType,
        unknownSongLabel: i18n(Key.unknownSong),
        unknownArtistLabel: i18n(Key.unknownArtist),
      });

      if (playlist.length > 0) {
        loadSong(playlist[0]);
        return;
      }

      showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
    } catch (_error) {
      showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
    } finally {
      isLoading = false;
    }
  }

  function lazyLoadPlaylist() {
    if (playlistLoaded) return;
    playlistLoaded = true;
    void fetchMetingPlaylist();
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
        audio?.load();
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

  function seekToPercent(percent: number) {
    if (!audio || duration <= 0) return;

    const newTime = percent * duration;
    audio.currentTime = newTime;
    currentTime = newTime;
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
    <ErrorToast message={errorMessage} onDismiss={() => (showError = false)} />
  {/if}

  <div
    bind:this={playerRoot}
    class="music-player fixed bottom-8 right-6 z-50 transition-all duration-300 ease-in-out"
    class:hidden-mode={isHidden}
  >
    <CollapsedPlayer
      {isHidden}
      {isLoading}
      {isPlaying}
      onToggleHidden={toggleHidden}
    />

    <ExpandedPlayer
      {currentSong}
      {currentTime}
      {duration}
      {isHidden}
      {isLoading}
      {isPlaying}
      {isRepeating}
      {isShuffled}
      {showPlaylist}
      playlistLength={playlist.length}
      onNextSong={() => nextSong()}
      onPreviousSong={previousSong}
      onSeekPercent={seekToPercent}
      onToggleHidden={toggleHidden}
      onTogglePlay={togglePlay}
      onTogglePlaylist={togglePlaylist}
      onToggleRepeat={toggleRepeat}
    />

    {#if showPlaylist}
      <PlaylistPanel
        bind:panelElement={playlistPanel}
        {currentIndex}
        {isPlaying}
        {playlist}
        onPlaySong={playSong}
        onTogglePlaylist={togglePlaylist}
      />
    {/if}
  </div>
{/if}
