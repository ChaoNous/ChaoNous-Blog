<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";
	import { musicPlayerConfig } from "../../config";
	import hitoriCover from "../../assets/music/cover/hitori.jpg";
	import Key from "../../i18n/i18nKey";
	import { i18n } from "../../i18n/translation";
	import { fetchMetingPlaylistSongs } from "../../scripts/music-player/player-meting";
	import {
		getLoadingSong as getInitialLoadingSong,
		buildLocalPlaylist,
	} from "../../scripts/music-player/player-local";
	import {
		cacheInitialSong,
		loadStoredVolume,
		restoreCachedInitialSong,
		saveStoredVolume,
	} from "../../scripts/music-player/player-storage";
	import {
		bindAutoplayRecovery,
		bindPlayerDocumentEvents,
		scheduleInitialPlaylistLoad,
	} from "../../scripts/music-player/player-runtime";
	import { getAssetPath, type Song } from "../../scripts/music-player/player-types";

	// Music player mode: local playlist or Meting API
	let mode = musicPlayerConfig.mode ?? "meting";
	// Meting API endpoint
	let meting_api =
		musicPlayerConfig.meting_api ??
		"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
	// Meting playlist identifier
	let meting_id = musicPlayerConfig.id ?? "14164869977";
	// Meting source provider
	let meting_server = musicPlayerConfig.server ?? "netease";
	// Meting source type
	let meting_type = musicPlayerConfig.type ?? "playlist";

	// Playback state
	let isPlaying = false;
	// Whether the player panel is expanded
	let isExpanded = false;
	// Whether the player is hidden in orb mode
	let isHidden = false;
	// Whether the playlist panel is visible
	let showPlaylist = false;
	// Whether the mobile volume popover is visible
	let showMobileVolumePopover = false;
	// Current playback position in seconds
	let currentTime = 0;
	// Current track duration in seconds
	let duration = 0;

	// Current volume
	let volume = 0.7;
	// Whether audio is muted
	let isMuted = false;
	// Whether playlist or track data is loading
	let isLoading = false;
	// Whether shuffle mode is enabled
	let isShuffled = false;
	// Repeat mode: 1 for single-track repeat, 2 for playlist repeat
	let isRepeating = 2;
	// Error message shown in the UI
	let errorMessage = "";
	// Whether the error toast is visible
	let showError = false;
	// Whether the full music font has been loaded
	let musicFontLoaded = false;
	let isMobileViewport = false;
	let hasMounted = false;

	// Lazy load the full music font only when needed (saves ~4.8MB)
	function loadMusicFont() {
		if (musicFontLoaded || typeof document === "undefined") return;
		musicFontLoaded = true;
		const fontFace = new FontFace(
			"Zhuque Fangsong",
			"url(/assets/fonts/ZhuqueFangsong-Regular.ttf)",
			{ weight: "400", style: "normal", display: "swap" }
		);
		fontFace.load().then((loaded) => {
			document.fonts.add(loaded);
			// Force re-render to apply new font
			playerRoot?.style.setProperty("--font-loaded", "1");
		}).catch(() => {
			// Font load failed, UI font fallback will be used
		});
	}

	const localPlaylist: Song[] = buildLocalPlaylist(hitoriCover);

	function getLoadingSong(): Song {
		return getInitialLoadingSong(
			mode,
			localPlaylist,
			i18n(Key.musicPlayerLoading),
			i18n(Key.unknownArtist),
		);
	}

	let currentSong: Song = getLoadingSong();

	let playlist: Song[] = [];
	let currentIndex = 0;
	let audio: HTMLAudioElement;
	let progressBar: HTMLElement;
	let volumeBar: HTMLElement;
	let playerRoot: HTMLDivElement;
	let playlistPanel: HTMLDivElement;

	function restoreCachedInitialSongState() {
		const cachedSong = restoreCachedInitialSong(mode);
		if (cachedSong) {
			currentSong = cachedSong;
		}
	}

	// Load volume settings from localStorage
	function loadVolumeSettings() {
		volume = loadStoredVolume(volume);
	}
	// Persist volume settings to localStorage
	function saveVolumeSettings() {
		saveStoredVolume(volume);
	}

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
				cacheInitialSong(mode, playlist[0]);
				loadSong(playlist[0]);
			}
			isLoading = false;
		} catch (e) {
			showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
			isLoading = false;
		}
	}

	function togglePlay() {
		if (!playlistLoaded) {
			lazyLoadPlaylist();
		}
		if (!audio || !currentSong.url) return;
		loadMusicFont();
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch(() => {});
		}
	}

	function toggleExpanded() {
		if (!playlistLoaded) {
			lazyLoadPlaylist();
		}
		loadMusicFont();
		isExpanded = !isExpanded;
		if (isExpanded) {
			showPlaylist = false;
			isHidden = false;
		}
	}

	function toggleHidden() {
		isHidden = !isHidden;
		if (isHidden) {
			isExpanded = false;
			showPlaylist = false;
			showMobileVolumePopover = false;
		}
	}

	function togglePlaylist() {
		if (!playlistLoaded) {
			lazyLoadPlaylist();
		}
		showMobileVolumePopover = false;
		showPlaylist = !showPlaylist;
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
		const newIndex =
			currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
		playSong(newIndex);
	}

	function nextSong(autoPlay: boolean = true) {
		if (playlist.length <= 1) return;

		let newIndex: number;
		if (isShuffled) {
			do {
				newIndex = Math.floor(Math.random() * playlist.length);
			} while (newIndex === currentIndex && playlist.length > 1);
		} else {
			newIndex =
				currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
		}
		playSong(newIndex, autoPlay);
	}

	// Record whether the next track should auto-play after loading
	let willAutoPlay = false;

	function playSong(index: number, autoPlay = true) {
		if (index < 0 || index >= playlist.length) return;

		willAutoPlay = autoPlay;
		currentIndex = index;
		loadSong(playlist[currentIndex]);
	}

	function loadSong(song: typeof currentSong) {
		if (!song) return;

		// Reset the audio element before loading the next track
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
		}

		currentSong = { ...song };
		if (song.url) {
			isLoading = true;
			// Reload the audio element after updating the source
			setTimeout(() => {
				if (audio) {
					audio.load();
				}
			}, 50);
		} else {
			isLoading = false;
		}
	}

	// Whether autoplay failed due to browser policy
	let autoplayFailed = false;

	function handleLoadSuccess() {
		isLoading = false;
		if (audio?.duration && audio.duration > 1) {
			duration = Math.floor(audio.duration);
			if (playlist[currentIndex])
				playlist[currentIndex].duration = duration;
			currentSong.duration = duration;
		}

		if (willAutoPlay || isPlaying) {
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {
					console.warn(
						"Autoplay was blocked until user interaction.",
						error,
					);
					autoplayFailed = true;
					isPlaying = false;
				});
			}
		}
	}

	function handleLoadError(_event: Event) {
		console.error(
			"[MusicPlayer] Load error for song:",
			currentSong.title,
			"URL:",
			currentSong.url,
		);
		if (!currentSong.url) return;
		isLoading = false;
		showErrorMessage(
			`${i18n(Key.musicPlayerErrorSong)} - ${currentSong.title}`,
		);

		const shouldContinue = isPlaying || willAutoPlay;
		if (playlist.length > 1) {
			setTimeout(() => nextSong(shouldContinue), 1000);
		} else {
			showErrorMessage(i18n(Key.musicPlayerErrorEmpty));
		}
	}

	function handleLoadStart() {}

	function handleAudioEnded() {
		if (isRepeating === 1) {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		} else if (isRepeating === 2 || isShuffled) {
			nextSong(true);
		} else {
			isPlaying = false;
		}
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
		if (!audio || !progressBar) return;
		const rect = progressBar.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const newTime = percent * duration;
		audio.currentTime = newTime;
		currentTime = newTime;
	}

	let isVolumeDragging = false;
	let isPointerDown = false;
	let volumeBarRect: DOMRect | null = null;
	let rafId: number | null = null;

	function startVolumeDrag(event: PointerEvent) {
		if (!volumeBar) return;
		event.preventDefault();

		isPointerDown = true;
		volumeBar.setPointerCapture(event.pointerId);

		volumeBarRect = volumeBar.getBoundingClientRect();
		updateVolumeLogic(event.clientY);
	}

	function handleVolumeMove(event: PointerEvent) {
		if (!isPointerDown) return;
		event.preventDefault();

		isVolumeDragging = true;
		if (rafId) return;

		rafId = requestAnimationFrame(() => {
			updateVolumeLogic(event.clientY);
			rafId = null;
		});
	}

	function stopVolumeDrag(event: PointerEvent) {
		if (!isPointerDown) return;
		isPointerDown = false;
		isVolumeDragging = false;
		volumeBarRect = null;
		if (volumeBar) {
			volumeBar.releasePointerCapture(event.pointerId);
		}

		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		saveVolumeSettings();
	}

	function updateVolumeLogic(clientY: number) {
		if (!audio || !volumeBar) return;

		const rect = volumeBarRect || volumeBar.getBoundingClientRect();
		const percent = Math.max(
			0,
			Math.min(1, (rect.bottom - clientY) / rect.height),
		);
		volume = percent;
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	function toggleVolumeControl(event: MouseEvent) {
		event.stopPropagation();
		if (
			typeof window !== "undefined" &&
			window.matchMedia("(max-width: 768px)").matches
		) {
			showMobileVolumePopover = !showMobileVolumePopover;
			return;
		}
		toggleMute();
	}

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	// Track whether the playlist has been loaded
	let playlistLoaded = false;

	// Delay playlist setup until idle time or the first interaction
	function lazyLoadPlaylist() {
		if (playlistLoaded) return;
		playlistLoaded = true;

		if (mode === "meting") {
			fetchMetingPlaylist();
		} else {
			// Use the local playlist without any API request
			playlist = [...localPlaylist];
			if (playlist.length > 0) {
				loadSong(playlist[0]);
			} else {
				showErrorMessage("Local playlist is empty.");
			}
		}
	}

	onMount(() => {
		const cleanups: Array<() => void> = [];

		if (typeof window !== "undefined") {
			isMobileViewport = window.innerWidth < 768;
		}
		if (isMobileViewport) {
			isHidden = true;
		}
		hasMounted = true;
		loadVolumeSettings();
		if (!(isMobileViewport && mode === "meting")) {
			restoreCachedInitialSongState();
		}

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
				hideMobileVolumePopover: () => {
					showMobileVolumePopover = false;
				},
			}),
		);

		scheduleInitialPlaylistLoad({
			enabled: musicPlayerConfig.enable,
			mode,
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
	bind:volume
	bind:muted={isMuted}
	on:play={() => (isPlaying = true)}
	on:pause={() => (isPlaying = false)}
	on:timeupdate={() => (currentTime = audio.currentTime)}
	on:ended={handleAudioEnded}
	on:error={handleLoadError}
	on:loadeddata={handleLoadSuccess}
	on:loadstart={handleLoadStart}
	preload="none"
></audio>

<svelte:window
	on:pointermove={handleVolumeMove}
	on:pointerup={stopVolumeDrag}
/>

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
		class:expanded={isExpanded}
		class:hidden-mode={isHidden}
		class:hydrated={hasMounted}
	>
		<!-- Orb trigger shown when the player is hidden -->
		<div
			class="orb-player rounded-xl cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center"
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
		<!-- Mini player shown when collapsed -->
		<div
			class="mini-player card-base rounded-2xl transition-all duration-500 ease-in-out overflow-hidden"
			style="background: var(--display-panel-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);"
			class:opacity-0={isExpanded || isHidden}
			class:scale-95={isExpanded || isHidden}
			class:pointer-events-none={isExpanded || isHidden}
		>
				<div class="mini-player-surface p-3" style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit;">
			<div class="flex items-center gap-3">
				<!-- Cover image area that toggles play and pause -->
				<div
					class="cover-container relative w-12 h-12 rounded-full overflow-hidden cursor-pointer"
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
							<Icon
								icon="material-symbols:album-outline"
								class="text-xl"
							/>
						</div>
					{/if}
					<div
						class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
					>
						{#if isLoading}
							<Icon
								icon="eos-icons:loading"
								class="text-white text-xl"
							/>
						{:else if isPlaying}
							<Icon
								icon="material-symbols:pause"
								class="text-white text-xl"
							/>
						{:else}
							<Icon
								icon="material-symbols:play-arrow"
								class="text-white text-xl"
							/>
						{/if}
					</div>
				</div>
				<!-- Track info area that expands the full player -->
				<div
					class="flex-1 min-w-0 cursor-pointer"
					on:click={toggleExpanded}
					on:keydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							toggleExpanded();
						}
					}}
					role="button"
					tabindex="0"
					aria-label={i18n(Key.musicPlayerExpand)}
				>
					<div class="text-sm font-medium text-90 truncate">
						{currentSong.title}
					</div>
					<div class="text-xs text-50 truncate">
						{currentSong.artist}
					</div>
				</div>
				<div class="flex items-center gap-1">
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						aria-label={i18n(Key.musicPlayerHide)}
						on:click|stopPropagation={toggleHidden}
						title={i18n(Key.musicPlayerHide)}
					>
						<Icon
							icon="material-symbols:visibility-off"
							class="text-lg"
						/>
					</button>
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						aria-label={i18n(Key.musicPlayerExpand)}
						on:click|stopPropagation={toggleExpanded}
					>
						<Icon
							icon="material-symbols:expand-less"
							class="text-lg"
						/>
					</button>
				</div>
			</div>
					</div>
		</div>
		<!-- Full player shown when expanded -->
		<div
			class="expanded-player card-base rounded-2xl transition-all duration-500 ease-in-out overflow-hidden"
			style="background: var(--display-panel-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);"
			class:opacity-0={!isExpanded}
			class:scale-95={!isExpanded}
			class:pointer-events-none={!isExpanded}
		>
				<div class="expanded-player-surface p-4" style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit;">
			<div class="flex items-center gap-4 mb-4">
				<div
					class="cover-container relative w-16 h-16 rounded-full overflow-hidden shrink-0"
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
							<Icon
								icon="material-symbols:album-outline"
								class="text-2xl"
							/>
						</div>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<div
						class="song-title text-lg font-bold text-90 truncate mb-1"
					>
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
						<Icon
							icon="material-symbols:visibility-off"
							class="text-lg"
						/>
					</button>
					<button
						class="btn-plain w-8 h-8 rounded-lg flex items-center justify-center"
						aria-label={i18n(Key.musicPlayerPlaylist)}
						class:text-[var(--primary)]={showPlaylist}
						on:click={togglePlaylist}
						title={i18n(Key.musicPlayerPlaylist)}
					>
						<Icon
							icon="material-symbols:queue-music"
							class="text-lg"
						/>
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
					aria-valuenow={duration > 0
						? (currentTime / duration) * 100
						: 0}
				>
					<div
						class="h-full bg-(--primary) rounded-full transition-all duration-100"
						style="width: {duration > 0
							? (currentTime / duration) * 100
							: 0}%"
					></div>
				</div>
			</div>
			<div class="controls flex items-center justify-center gap-2 mb-4">
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
						<Icon
							icon="material-symbols:repeat-one"
							class="text-lg"
						/>
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
					<Icon
						icon="material-symbols:skip-previous"
						class="text-xl"
					/>
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
						<Icon
							icon="material-symbols:play-arrow"
							class="text-xl"
						/>
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
				<div class="volume-control">
					<button
						class="btn-plain w-10 h-10 rounded-lg"
						aria-label={i18n(Key.musicPlayerVolume)}
						on:click={toggleVolumeControl}
					>
						{#if isMuted || volume === 0}
							<Icon
								icon="material-symbols:volume-off"
								class="text-lg"
							/>
						{:else if volume < 0.5}
							<Icon
								icon="material-symbols:volume-down"
								class="text-lg"
							/>
						{:else}
							<Icon
								icon="material-symbols:volume-up"
								class="text-lg"
							/>
						{/if}
					</button>
					<div
						class="volume-popover rounded-2xl card-base overflow-hidden"
						class:is-open={showMobileVolumePopover}
						style="background: var(--display-panel-bg); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);"
					>
							<div class="volume-popover-surface p-3" style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit;">
						<div
							class="volume-bar h-28 w-3 bg-(--btn-regular-bg) rounded-full cursor-pointer touch-none"
							bind:this={volumeBar}
							on:pointerdown={startVolumeDrag}
							on:keydown={(e) => {
								if (e.key === "ArrowUp") {
									e.preventDefault();
									volume = Math.min(1, volume + 0.05);
									saveVolumeSettings();
								} else if (e.key === "ArrowDown") {
									e.preventDefault();
									volume = Math.max(0, volume - 0.05);
									saveVolumeSettings();
								} else if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									if (
										typeof window === "undefined" ||
										!window.matchMedia("(max-width: 768px)").matches
									) {
										toggleMute();
									}
								}
							}}
							role="slider"
							tabindex="0"
							aria-label={i18n(Key.musicPlayerVolume)}
							aria-orientation="vertical"
							aria-valuemin="0"
							aria-valuemax="100"
							aria-valuenow={volume * 100}
						>
							<div
								class="volume-fill absolute bottom-0 left-0 right-0 bg-(--primary) rounded-full transition-all"
								class:duration-100={!isVolumeDragging}
								class:duration-0={isVolumeDragging}
								style="height: {volume * 100}%"
							></div>
						</div>
							</div>
					</div>
				</div>
				<button
					class="btn-plain w-10 h-10 rounded-lg flex items-center justify-center"
					aria-label={i18n(Key.musicPlayerCollapse)}
					on:click={toggleExpanded}
					title={i18n(Key.musicPlayerCollapse)}
				>
					<Icon icon="material-symbols:expand-more" class="text-lg" />
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
					<div class="playlist-panel-surface" style="background: var(--panel-bg); border: 1px solid var(--display-panel-border); box-shadow: var(--shadow-lg); border-radius: inherit; overflow: hidden;">
				<div
					class="playlist-header flex items-center justify-between p-4 border-b border-(--line-divider)"
				>
					<h3 class="text-lg font-semibold text-90">
						{i18n(Key.musicPlayerPlaylist)}
					</h3>
					<button
						class="btn-plain w-8 h-8 rounded-lg"
						aria-label={i18n(Key.musicPlayerHide)}
						on:click={togglePlaylist}
					>
						<Icon icon="material-symbols:close" class="text-lg" />
					</button>
				</div>
				<div
					class="playlist-content overflow-y-auto max-h-80 hide-scrollbar"
				>
					{#each playlist as song, index}
						<div
							class="playlist-item flex items-center gap-3 p-3 hover:bg-(--btn-plain-bg-hover) cursor-pointer transition-colors"
							class:bg-[var(--btn-plain-bg)]={index ===
								currentIndex}
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
							<div
								class="w-6 h-6 flex items-center justify-center"
							>
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
									class:text-[var(--primary)]={index ===
										currentIndex}
									class:text-90={index !== currentIndex}
								>
									{song.title}
								</div>
								<div
									class="text-sm text-(--content-meta) truncate"
									class:text-[var(--primary)]={index ===
										currentIndex}
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
