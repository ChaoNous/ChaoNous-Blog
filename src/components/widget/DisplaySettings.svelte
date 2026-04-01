<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import { getDefaultHue, getHueUI, setHueUI, hueToUi } from "@utils/setting-utils";
	import { onMount } from "svelte";

	const colorOptions = [
		{ hue: 60, name: "金黄", color: "oklch(0.75 0.15 60)" },
		{ hue: 150, name: "青绿", color: "oklch(0.75 0.15 150)" },
		{ hue: 280, name: "紫罗兰", color: "oklch(0.75 0.15 280)" },
		{ hue: 350, name: "玫红", color: "oklch(0.75 0.15 350)" },
	];

	let hueUI = 150;
	let defaultHueUI = 150;
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
		// 如果存储的值不在选项中，使用默认值
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
		<div class="color-options flex gap-2 justify-center">
			{#each colorOptions as opt}
				<button
					class="color-btn w-12 h-12 rounded-lg transition-all duration-200 active:scale-90"
					class:selected={hueUI === opt.hue}
					style="background: {opt.color};"
					on:click={() => selectHue(opt.hue)}
					aria-label={opt.name}
					title={opt.name}
				>
					{#if hueUI === opt.hue}
						<span class="check-icon text-white/90 text-[1rem]">✓</span>
					{/if}
				</button>
			{/each}
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

	.color-btn
		border 2px solid transparent
		box-shadow 0 2px 6px rgba(0, 0, 0, 0.15)
		cursor pointer
		display flex
		align-items center
		justify-content center

		&:hover
			transform scale(1.08)
			box-shadow 0 4px 12px rgba(0, 0, 0, 0.2)

		&.selected
			border 2px solid rgba(255, 255, 255, 0.5)
			box-shadow 0 0 0 3px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.25)

	.check-icon
		font-weight bold
		user-select none
</style>