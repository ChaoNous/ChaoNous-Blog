<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount } from "svelte";
	import { musicPlayerConfig } from "../../config";
	import hitoriCover from "../../assets/music/cover/hitori.jpg";
	import Key from "../../i18n/i18nKey";
	import { i18n } from "../../i18n/translation";

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
	// Current playback position in seconds
	let currentTime = 0;
	// Current track duration in seconds
	let duration = 0;

	// localStorage key for persisted volume
	const STORAGE_KEY_VOLUME = "music-player-volume";
	const STORAGE_KEY_INITIAL_SONG = "music-player-initial-song";

	type Song = {
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

	function createSong(
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

	const localPlaylist: Song[] = [
		createSong({
			id: 1,
			title: "Hitori no Uta",
			artist: "Kaya",
			cover: hitoriCover,
			url: "assets/music/url/hitori.mp3",
			duration: 240,
		}),
		createSong({
			id: 2,
			title: "Xing Ri Yu Xing",
			artist: "Stereo Dive Foundation",
			cover: "assets/music/cover/xryx.webp",
			url: "assets/music/url/xryx.mp3",
			duration: 180,
		}),
		createSong({
			id: 3,
			title: "Chun Lei",
			artist: "22/7",
			cover: "assets/music/cover/cl.webp",
			url: "assets/music/url/cl.mp3",
			duration: 200,
		}),
	];

	function getLoadingSong(): Song {
		if (mode === "local" && localPlaylist.length > 0) {
			return { ...localPlaylist[0] };
		}

		return createSong({
			title: i18n(Key.musicPlayerLoading),
			artist: i18n(Key.unknownArtist),
		});
	}

	let currentSong: Song = getLoadingSong();

	let playlist: Song[] = [];
	let currentIndex = 0;
	let audio: HTMLAudioElement;
	let progressBar: HTMLElement;
	let volumeBar: HTMLElement;
	let playerRoot: HTMLDivElement;
	let playlistPanel: HTMLDivElement;

	function restoreCachedInitialSong() {
		if (mode !== "meting" || typeof localStorage === "undefined") return;

		try {
			const cached = localStorage.getItem(STORAGE_KEY_INITIAL_SONG);
			if (!cached) return;

			const parsed = JSON.parse(cached) as Partial<Song>;
			if (
				typeof parsed.title !== "string" ||
				typeof parsed.artist !== "string"
			) {
				return;
			}

			currentSong = createSong({
				id: parsed.id,
				title: parsed.title,
				artist: parsed.artist,
				cover: parsed.cover,
				url: parsed.url,
				duration: parsed.duration,
			});
		} catch (error) {
			console.warn("Failed to restore cached initial song:", error);
		}
	}

	function cacheInitialSong(song: Song) {
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
	// Load volume settings from localStorage
	function loadVolumeSettings() {
		try {
			if (typeof localStorage !== "undefined") {
				const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
				if (savedVolume !== null && !isNaN(parseFloat(savedVolume))) {
					volume = parseFloat(savedVolume);
				}
			}
		} catch (e) {
			console.warn(
				"Failed to load volume settings from localStorage:",
				e,
			);
		}
	}
	// Persist volume settings to localStorage
	function saveVolumeSettings() {
		try {
			if (typeof localStorage !== "undefined") {
				localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
			}
		} catch (e) {
			console.warn("Failed to save volume settings to localStorage:", e);
		}
	}

	async function fetchMetingPlaylist() {
		if (!meting_api || !meting_id) return;
		isLoading = true;
		const apiUrl = meting_api
			.replace(":server", meting_server)
			.replace(":type", meting_type)
			.replace(":id", meting_id)
			.replace(":auth", "")
			.replace(":r", Date.now().toString());
		try {
			const res = await fetch(apiUrl);
			if (!res.ok) throw new Error("meting api error");
			const list = await res.json();
			playlist = list.map((song: any) => {
				let title = song.name ?? song.title ?? i18n(Key.unknownSong);
				let artist =
					song.artist ?? song.author ?? i18n(Key.unknownArtist);
				let dur = song.duration ?? 0;
				if (dur > 10000) dur = Math.floor(dur / 1000);
				if (!Number.isFinite(dur) || dur <= 0) dur = 0;
				return createSong({
					id: song.id,
					title,
					artist,
					cover: song.pic ?? "",
					url: song.url ?? "",
					duration: dur,
				});
			});
			if (playlist.length > 0) {
				cacheInitialSong(playlist[0]);
				loadSong(playlist[0]);
			}
			isLoading = false;
		} catch (e) {
			showErrorMessage(i18n(Key.musicPlayerErrorPlaylist));
			isLoading = false;
		}
	}

	function togglePlay() {
		if (!audio || !currentSong.url) return;
		loadMusicFont();
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch(() => {});
		}
	}

	function toggleExpanded() {
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
		}
	}

	function togglePlaylist() {
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

	function getAssetPath(path: string | undefined | null): string {
		if (!path || typeof path !== "string") return "";
		if (path.startsWith("http://") || path.startsWith("https://"))
			return path;
		if (path.startsWith("/")) return path;
		return `/${path}`;
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

	function handleUserInteraction() {
		if (autoplayFailed && audio) {
			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						autoplayFailed = false;
					})
					.catch(() => {});
			}
		}
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!showPlaylist) return;
		const target = event.target;
		if (!(target instanceof Node)) return;
		if (playlistPanel?.contains(target) || playerRoot?.contains(target))
			return;
		closePlaylist();
	}

	function handleDocumentKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && showPlaylist) {
			closePlaylist();
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

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	const interactionEvents = ["click", "keydown", "touchstart"];

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
		if (typeof window !== "undefined" && window.innerWidth < 768) {
			isHidden = true;
		}
		loadVolumeSettings();
		restoreCachedInitialSong();
		interactionEvents.forEach((event) => {
			document.addEventListener(event, handleUserInteraction, {
				capture: true,
			});
		});
		document.addEventListener("click", handleDocumentClick);
		document.addEventListener("keydown", handleDocumentKeydown);

		if (!musicPlayerConfig.enable) {
			return;
		}

		if (mode === "meting") {
			// 在线歌单立即拉取，首屏尽快替换成真实第一首歌信息。
			lazyLoadPlaylist();
		} else if ("requestIdleCallback" in window) {
			// 本地模式已经能直接展示第一首歌，歌单初始化继续延后。
			requestIdleCallback(
				() => {
					lazyLoadPlaylist();
				},
				{ timeout: 5000 },
			);
		} else {
			setTimeout(lazyLoadPlaylist, 3000);
		}
	});

	onDestroy(() => {
		if (typeof document !== "undefined") {
			interactionEvents.forEach((event) => {
				document.removeEventListener(event, handleUserInteraction, {
					capture: true,
				});
			});
			document.removeEventListener("click", handleDocumentClick);
			document.removeEventListener("keydown", handleDocumentKeydown);
		}
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
		class="music-player fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out"
		class:expanded={isExpanded}
		class:hidden-mode={isHidden}
	>
		<!-- Orb trigger shown when the player is hidden -->
		<div
			class="orb-player w-12 h-12 bg-(--primary) rounded-full shadow-lg cursor-pointer transition-all duration-500 ease-in-out flex items-center justify-center hover:scale-110 active:scale-95"
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
				<Icon icon="eos-icons:loading" class="text-white text-lg" />
			{:else if isPlaying}
				<div class="flex space-x-0.5">
					<div
						class="w-0.5 h-3 bg-white rounded-full animate-pulse"
					></div>
					<div
						class="w-0.5 h-4 bg-white rounded-full animate-pulse"
						style="animation-delay: 150ms;"
					></div>
					<div
						class="w-0.5 h-2 bg-white rounded-full animate-pulse"
						style="animation-delay: 300ms;"
					></div>
				</div>
			{:else}
				<Icon
					icon="material-symbols:music-note"
					class="text-white text-lg"
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
					class="w-10 h-10 rounded-lg btn-regular"
					aria-label={isShuffled
						? i18n(Key.musicPlayerShuffle)
						: isRepeating === 1
							? i18n(Key.musicPlayerRepeatOne)
							: i18n(Key.musicPlayerRepeat)}
					on:click={toggleRepeat}
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
					class="btn-regular w-12 h-12 rounded-full"
					aria-label={isPlaying
						? i18n(Key.musicPlayerPause)
						: i18n(Key.musicPlayerPlay)}
					class:opacity-50={isLoading}
					disabled={isLoading}
					on:click={togglePlay}
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
						on:click={toggleMute}
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
									toggleMute();
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
				class="playlist-panel animate-slide-up float-panel fixed bottom-20 right-4 w-80 max-h-96 overflow-hidden z-50"
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
		.orb-player {
			position: relative;
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
		}
		.orb-player::before {
			content: "";
			position: absolute;
			inset: -0.125rem;
			background: linear-gradient(
				45deg,
				var(--primary),
				transparent,
				var(--primary)
			);
			border-radius: 50%;
			z-index: -1;
			opacity: 0;
			transition: opacity 0.3s ease;
		}
		.orb-player:hover::before {
			opacity: 0.3;
			animation: rotate 2s linear infinite;
		}
		.orb-player .animate-pulse {
			animation: musicWave 1.5s ease-in-out infinite;
		}
		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}
		@keyframes musicWave {
			0%,
			100% {
				transform: scaleY(0.5);
			}
			50% {
				transform: scaleY(1);
			}
		}
		.music-player.hidden-mode {
			width: 3rem;
			height: 3rem;
		}
		.music-player {
			max-width: 20rem;
			user-select: none;
		}
		.mini-player {
			width: 17.5rem;
			position: absolute;
			bottom: 0;
			right: 0;
			/*left: 0;*/
		}
		.expanded-player {
			width: 20rem;
			position: absolute;
			bottom: 0;
			right: 0;
		}
		.music-player button,
		.music-player [role="button"],
		.progress-bar,
		.volume-bar,
		.playlist-item,
		.mini-player,
		.expanded-player,
		.playlist-panel,
		.cover-container {
			transition:
				transform 0.18s ease,
				box-shadow 0.18s ease,
				background-color 0.18s ease,
				color 0.18s ease,
				opacity 0.18s ease;
		}

		.music-player button:focus-visible,
		.music-player [role="button"]:focus-visible,
		.progress-bar:focus-visible,
		.volume-bar:focus-visible,
		.playlist-item:focus-visible {
			outline: 2px solid var(--primary);
			outline-offset: 2px;
		}

		.music-player button {
			border-radius: 0.75rem;
		}

		@media (hover: hover) and (pointer: fine) {
			.mini-player:hover,
			.expanded-player:hover,
			.playlist-panel:hover {
				transform: translateY(-2px);
				box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
			}

			.music-player button:hover:not(:disabled),
			.music-player [role="button"]:hover,
			.progress-bar:hover,
			.volume-bar:hover,
			.playlist-item:hover,
			.cover-container:hover {
				transform: translateY(-1px) scale(1.03);
			}

			.music-player button:hover:not(:disabled),
			.music-player [role="button"]:hover {
				color: var(--primary);
			}

			.progress-bar:hover,
			.volume-bar:hover {
				box-shadow: 0 0 0 1px
					color-mix(in oklab, var(--primary) 35%, transparent);
			}
		}

		.music-player button:hover:not(:disabled),
		.music-player button:focus-visible {
			background-color: color-mix(
				in oklab,
				var(--primary) 16%,
				var(--btn-plain-bg)
			);
			box-shadow:
				0 0 0 1px color-mix(in oklab, var(--primary) 42%, transparent),
				inset 0 0 0 999px
					color-mix(in oklab, var(--primary) 10%, transparent);
			color: var(--primary);
		}

		.music-player button:active:not(:disabled),
		.music-player [role="button"]:active,
		.playlist-item:active,
		.cover-container:active {
			transform: scale(0.96);
		}

		.animate-pulse {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}
		.progress-section div:hover,
		.volume-bar:hover {
			/* removed scaling as per user request */
			transition: transform 0.2s ease;
		}
		.volume-control {
			position: relative;
			width: fit-content;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.volume-popover {
			position: absolute;
			bottom: calc(100% + 0.125rem);
			left: 50%;
			width: max-content;
			opacity: 0;
			visibility: hidden;
			transform: translateX(-50%) translateY(8px);
			pointer-events: none;
			transition:
				opacity 0.18s ease,
				transform 0.18s ease,
				visibility 0.18s ease;
			z-index: 5;
		}
		.volume-control:hover .volume-popover,
		.volume-control:focus-within .volume-popover {
			opacity: 1;
			visibility: visible;
			transform: translateX(-50%) translateY(0);
			pointer-events: auto;
		}
		.volume-bar {
			position: relative;
			overflow: hidden;
		}
		.volume-fill {
			min-height: 0.25rem;
		}
		@media (max-width: 768px) {
			.music-player {
				max-width: min(280px, calc(100dvw - 1rem)) !important;
				/*left: 0.5rem !important;*/
				bottom: 0.5rem !important;
				right: 0.5rem !important;
			}
			.mini-player {
				width: min(280px, calc(100dvw - 1rem));
			}
			.music-player.expanded {
				width: calc(100dvw - 1rem);
				max-width: none;
				/*left: 0.5rem !important;*/
				right: 0.5rem !important;
			}
			.playlist-panel {
				width: calc(100dvw - 1rem) !important;
				/*left: 0.5rem !important;*/
				right: 0.5rem !important;
				max-width: none;
			}
			.controls {
				gap: 8px;
			}
			.controls button {
				width: 36px;
				height: 36px;
			}
			.controls button:nth-child(3) {
				width: 44px;
				height: 44px;
			}
			.volume-popover {
				bottom: calc(100% + 0.125rem);
			}
		}
		@media (max-width: 480px) {
			.music-player {
				max-width: 260px;
			}
			.song-title {
				font-size: 14px;
			}
			.song-artist {
				font-size: 12px;
			}
			.controls {
				gap: 6px;
				margin-bottom: 12px;
			}
			.controls button {
				width: 32px;
				height: 32px;
			}
			.controls button:nth-child(3) {
				width: 40px;
				height: 40px;
			}
			.playlist-item {
				padding: 8px 12px;
			}
			.playlist-item .w-10 {
				width: 32px;
				height: 32px;
			}
			.volume-bar {
				height: 6rem;
			}
		}
		@keyframes slide-up {
			from {
				transform: translateY(100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}
		.animate-slide-up {
			animation: slide-up 0.3s ease-out;
		}
		@media (hover: none) and (pointer: coarse) {
			.music-player button,
			.playlist-item {
				min-height: 44px;
			}
			.progress-section > div {
				height: 12px;
			}
			.volume-bar {
				height: 5rem;
				width: 0.875rem;
			}
			.volume-popover {
				padding: 0.375rem 0.625rem;
			}
		}
		/* Music player font - loaded dynamically via JavaScript to save ~4.8MB */
		/* Font is lazy loaded when user interacts with the player */

		/* Apply Zhuque Fangsong to all text in music player */
		/* Falls back to UI font (409KB) until full font is loaded */
		.music-player,
		.music-player *,
		.music-player button,
		.music-player span,
		.music-player div {
			font-family: var(--font-content) !important;
		}

		/* Keep the disc rotation smooth and resumable */
		@keyframes spin-continuous {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		.cover-container img {
			animation: spin-continuous 3s linear infinite;
			animation-play-state: paused;
		}

		.cover-container img.spinning {
			animation-play-state: running;
		}

		/* Make primary buttons feel more tactile */
		button.bg-\[var\(--primary\)\] {
			box-shadow: 0 0 0 2px var(--primary);
			border: none;
		}
	</style>
{/if}
