<script lang="ts">
	import { DARK_MODE, LIGHT_MODE } from "@constants/constants";
	import Icon from "@iconify/svelte";
	import { setTheme } from "@utils/setting-utils";

	let isChanging = false;

	function isDarkMode(): boolean {
		if (typeof document === "undefined") return false;
		return document.documentElement.classList.contains("dark");
	}

	function toggleScheme() {
		if (isChanging) return;

		isChanging = true;
		setTheme(isDarkMode() ? LIGHT_MODE : DARK_MODE);

		setTimeout(() => {
			isChanging = false;
		}, 50);
	}
</script>

<div class="relative z-50">
	<button
		aria-label="Light/Dark Mode"
		class="relative btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 theme-switch-btn"
		id="scheme-switch"
		on:click={toggleScheme}
	>
		<div
			class="theme-icon light-icon absolute transition-all duration-300 ease-in-out"
		>
			<Icon
				icon="material-symbols:wb-sunny-outline-rounded"
				class="text-[1.25rem]"
			/>
		</div>
		<div
			class="theme-icon dark-icon absolute transition-all duration-300 ease-in-out"
		>
			<Icon
				icon="material-symbols:dark-mode-outline-rounded"
				class="text-[1.25rem]"
			/>
		</div>
	</button>
</div>

<style>
	.theme-switch-btn::before {
		transition:
			transform 75ms ease-out,
			background-color 0ms !important;
	}

	.theme-icon {
		opacity: 1;
		transform: rotate(0deg);
	}

	.dark-icon {
		opacity: 0;
		transform: rotate(180deg);
	}

	:global(html.dark) .light-icon {
		opacity: 0;
		transform: rotate(180deg);
	}

	:global(html.dark) .dark-icon {
		opacity: 1;
		transform: rotate(0deg);
	}
</style>
