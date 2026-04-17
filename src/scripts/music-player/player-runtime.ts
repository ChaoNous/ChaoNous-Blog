type BindAutoplayRecoveryOptions = {
	getAudio: () => HTMLAudioElement | undefined;
	shouldRecover: () => boolean;
	onRecovered: () => void;
};

type BindPlayerDocumentEventsOptions = {
	getPlayerRoot: () => HTMLElement | null;
	getPlaylistPanel: () => HTMLElement | null;
	isPlaylistOpen: () => boolean;
	closePlaylist: () => void;
	hideMobileVolumePopover: () => void;
};

const interactionEvents = ["click", "keydown", "touchstart"] as const;

export function bindAutoplayRecovery(
	options: BindAutoplayRecoveryOptions,
): () => void {
	const { getAudio, shouldRecover, onRecovered } = options;

	const handleUserInteraction = () => {
		const audio = getAudio();
		if (!audio || !shouldRecover()) return;

		const playPromise = audio.play();
		if (playPromise !== undefined) {
			playPromise.then(onRecovered).catch(() => {});
		}
	};

	interactionEvents.forEach((eventName) => {
		document.addEventListener(eventName, handleUserInteraction, {
			capture: true,
		});
	});

	return () => {
		interactionEvents.forEach((eventName) => {
			document.removeEventListener(eventName, handleUserInteraction, {
				capture: true,
			});
		});
	};
}

export function bindPlayerDocumentEvents(
	options: BindPlayerDocumentEventsOptions,
): () => void {
	const {
		getPlayerRoot,
		getPlaylistPanel,
		isPlaylistOpen,
		closePlaylist,
		hideMobileVolumePopover,
	} = options;

	const handleDocumentClick = (event: MouseEvent) => {
		const target = event.target;
		const playerRoot = getPlayerRoot();
		if (target instanceof Node && !playerRoot?.contains(target)) {
			hideMobileVolumePopover();
		}

		if (!isPlaylistOpen()) return;
		if (!(target instanceof Node)) return;

		const playlistPanel = getPlaylistPanel();
		if (playlistPanel?.contains(target) || playerRoot?.contains(target)) return;
		closePlaylist();
	};

	const handleDocumentKeydown = (event: KeyboardEvent) => {
		if (event.key === "Escape" && isPlaylistOpen()) {
			closePlaylist();
		}
	};

	document.addEventListener("click", handleDocumentClick);
	document.addEventListener("keydown", handleDocumentKeydown);

	return () => {
		document.removeEventListener("click", handleDocumentClick);
		document.removeEventListener("keydown", handleDocumentKeydown);
	};
}

type ScheduleInitialPlaylistLoadOptions = {
	enabled: boolean;
	mode: string;
	isMobileViewport: boolean;
	lazyLoadPlaylist: () => void;
};

export function scheduleInitialPlaylistLoad(
	options: ScheduleInitialPlaylistLoadOptions,
) {
	const { enabled, mode, isMobileViewport, lazyLoadPlaylist } = options;
	if (!enabled) return;

	if (mode === "meting" && !isMobileViewport) {
		lazyLoadPlaylist();
		return;
	}

	if (mode !== "meting" && "requestIdleCallback" in window) {
		requestIdleCallback(
			() => {
				lazyLoadPlaylist();
			},
			{ timeout: 5000 },
		);
		return;
	}

	if (mode !== "meting") {
		setTimeout(lazyLoadPlaylist, 3000);
	}
}
