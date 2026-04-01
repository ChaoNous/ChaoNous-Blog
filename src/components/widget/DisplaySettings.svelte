<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import Icon from "@iconify/svelte";
	import { getDefaultHue, getHueUI, setHueUI, hueToUi } from "@utils/setting-utils";
	import { onMount } from "svelte";

	let hueUI = 70; // UI 显示值 0-100
	let defaultHueUI = 70;
	let isMounted = false;

	function resetHue() {
		hueUI = defaultHueUI;
	}

	onMount(() => {
		isMounted = true;
		defaultHueUI = hueToUi(getDefaultHue());
		hueUI = getHueUI();
	});

	$: if (isMounted && (hueUI || hueUI === 0)) {
		setHueUI(hueUI);
	}
</script>

<div
	id="display-setting"
	class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4"
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
					<Icon
						icon="fa7-solid:arrow-rotate-left"
						class="text-[0.875rem]"
					></Icon>
				</div>
			</button>
		</div>
		<div class="flex gap-1">
			<div
				id="hueValue"
				class="transition bg-(--btn-regular-bg) w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-(--btn-content)"
			>
				{hueUI}
			</div>
		</div>
	</div>
	<div
		class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none"
	>
		<input
			aria-label={i18n(I18nKey.themeColor)}
			type="range"
			min="0"
			max="100"
			bind:value={hueUI}
			class="slider"
			id="colorSlider"
			step="1"
			style="width: 100%"
		/>
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

    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-image var(--color-selection-bar)
        transition background-image 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

</style>
