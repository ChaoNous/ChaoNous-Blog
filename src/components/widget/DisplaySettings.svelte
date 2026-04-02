<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import { getDefaultHue, getHueUI, setHueUI } from "@utils/setting-utils";
	import { onMount } from "svelte";

	const colorOptions = [
		{ hue: 5, name: "朱赤", color: "oklch(0.75 0.15 5)" },
		{ hue: 229, name: "波斯蓝", color: "oklch(0.75 0.15 229)" },
		{ hue: 325, name: "泰尔紫", color: "oklch(0.75 0.15 325)" },
	];

	let hueUI = 5;
	let defaultHueUI = 5;
	let isMounted = false;

	function selectHue(hue: number) {
		hueUI = hue;
	}

	function resetHue() {
		hueUI = defaultHueUI;
	}

	onMount(() => {
		isMounted = true;
		defaultHueUI = getDefaultHue();
		const stored = getHueUI();
		if (colorOptions.some(opt => opt.hue === stored)) {
			hueUI = stored;
		} else {
			hueUI = defaultHueUI;
			setHueUI(defaultHueUI);
		}
	});

	$: if (isMounted && (hueUI || hueUI === 0)) {
		setHueUI(hueUI);
	}
</script>

<div
	id="display-setting"
	class="float-panel float-panel-closed absolute transition-all w-72 right-4 px-4 py-4"
	style="
		background: var(--display-panel-bg);
		backdrop-filter: blur(20px) saturate(160%);
		-webkit-backdrop-filter: blur(20px) saturate(160%);
		border: 1px solid var(--display-panel-border);
		box-shadow: var(--display-panel-shadow);
		border-radius: var(--radius-large);
	"
>
	<div class="display-setting-surface">
		<div class="flex flex-row gap-2 mb-3 items-center justify-between">
			<div
				class="flex gap-2 font-bold text-lg text-90 transition relative ml-3
	            before:w-1 before:h-4 before:rounded-md before:bg-(--primary)
	            before:absolute before:-left-3 before:top-[0.33rem]"
			>
				{i18n(I18nKey.themeColor)}
				<button
					aria-label="Reset to Default"
					class="btn-regular w-7 h-7 rounded-md active:scale-90"
					class:opacity-0={hueUI === defaultHueUI}
					class:pointer-events-none={hueUI === defaultHueUI}
					on:click={resetHue}
				>
					<div class="text-(--btn-content)">
						<span class="text-[0.875rem]">↺</span>
					</div>
				</button>
			</div>
		</div>
		<div class="color-bar-container">
			<div class="color-bar">
				{#each colorOptions as opt, i}
					<button
						class="color-segment"
						class:selected={hueUI === opt.hue}
						style="background: {opt.color};"
						on:click={() => selectHue(opt.hue)}
						aria-label={opt.name}
						title={opt.name}
					>
						{#if hueUI === opt.hue}
							<span class="indicator"></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style lang="stylus">
	#display-setting
		padding 0 !important
		overflow hidden

		.display-setting-surface
			background var(--panel-bg)
			border 1px solid var(--display-panel-border)
			border-radius inherit
			box-shadow var(--shadow-lg)
			padding 1rem

	:global(html.dark) #display-setting .display-setting-surface
		background var(--panel-bg)
		border 1px solid var(--display-panel-border)
		box-shadow var(--shadow-lg)

	.color-bar-container
		padding 0.25rem

	.color-bar
		display flex
		height 2rem
		border-radius 0.375rem
		overflow hidden

	.color-segment
		flex 1 1 0
		border none
		cursor pointer
		position relative
		display flex
		align-items center
		justify-content center

		.indicator
			position absolute
			bottom 0.15rem
			left 50%
			transform translateX(-50%)
			width 0
			height 0
			border-left 0.4rem solid transparent
			border-right 0.4rem solid transparent
			border-bottom 0.5rem solid rgba(255, 255, 255, 0.85)
</style>