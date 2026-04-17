<script lang="ts">
	import I18nKey from "@i18n/i18nKey";
	import { i18n } from "@i18n/translation";
	import { url } from "@utils/url-utils";
	import { onDestroy, onMount } from "svelte";
	import type { SearchResult } from "@/global";

	let keywordDesktop = $state("");
	let keywordMobile = $state("");
	let result: SearchResult[] = $state([]);
	let pagefindLoaded = false;
	let initialized = $state(false);
	let isDesktopSearchExpanded = $state(false);
	let debounceTimer: NodeJS.Timeout;
	let blurTimer: NodeJS.Timeout;
	let desktopSearchInput: HTMLInputElement | null = null;
	let mobileSearchInput: HTMLInputElement | null = null;

	const searchLabel = i18n(I18nKey.search);
	const searchResultsLabel =
		searchLabel === "Search"
			? "Search results"
			: "\u641c\u7d22\u7ed3\u679c";

	const fakeResult: SearchResult[] = [
		{
			url: url("/"),
			meta: {
				title: "This Is a Fake Search Result",
			},
			excerpt:
				"Because the search cannot work in the <mark>dev</mark> environment.",
		},
		{
			url: url("/"),
			meta: {
				title: "If You Want to Test the Search",
			},
			excerpt:
				"Try running <mark>npm build && npm preview</mark> instead.",
		},
	];

	const navigateToPage = (
		nextUrl: string,
		options?: {
			replace?: boolean;
		},
	): void => {
		if (
			nextUrl.startsWith("http://") ||
			nextUrl.startsWith("https://") ||
			nextUrl.startsWith("//")
		) {
			window.open(nextUrl, "_blank");
			return;
		}

		if (nextUrl.startsWith("#")) {
			document.getElementById(nextUrl.slice(1))?.scrollIntoView({
				behavior: "smooth",
			});
			return;
		}

		if (options?.replace) {
			window.location.replace(nextUrl);
		} else {
			window.location.href = nextUrl;
		}
	};

	const focusDesktopInput = () => {
		setTimeout(() => {
			desktopSearchInput?.focus();
		}, 0);
	};

	const openDesktopSearch = () => {
		if (isDesktopSearchExpanded) return;
		isDesktopSearchExpanded = true;
		focusDesktopInput();
	};

	const handleBlur = () => {
		blurTimer = setTimeout(() => {
			isDesktopSearchExpanded = false;
			setPanelVisibility(false, true);
		}, 200);
	};

	const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
		const panel = document.getElementById("search-panel");
		if (!panel || !isDesktop) return;
		panel.classList.toggle("float-panel-closed", !show);
	};

	const closeSearchPanel = (): void => {
		const panel = document.getElementById("search-panel");
		panel?.classList.add("float-panel-closed");
		keywordDesktop = "";
		keywordMobile = "";
		result = [];
		isDesktopSearchExpanded = false;
	};

	const handleResultClick = (event: Event, nextUrl: string): void => {
		event.preventDefault();
		closeSearchPanel();
		navigateToPage(nextUrl);
	};

	const handleSearchKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Escape") return;
		event.preventDefault();
		closeSearchPanel();
		desktopSearchInput?.blur();
		mobileSearchInput?.blur();
	};

	const search = async (
		keyword: string,
		isDesktop: boolean,
	): Promise<void> => {
		if (!keyword) {
			setPanelVisibility(false, isDesktop);
			result = [];
			return;
		}
		if (!initialized) return;

		try {
			let searchResults: SearchResult[] = [];

			if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
				const response = await window.pagefind.search(keyword);
				searchResults = await Promise.all(
					response.results.map((item) => item.data()),
				);
			} else if (import.meta.env.DEV) {
				searchResults = fakeResult;
			} else {
				console.error("Pagefind is not available in production environment.");
			}

			result = searchResults;
			setPanelVisibility(result.length > 0, isDesktop);
		} catch (error) {
			console.error("Search error:", error);
			result = [];
			setPanelVisibility(false, isDesktop);
		}
	};

	onMount(() => {
		const initializeSearch = () => {
			initialized = true;
			pagefindLoaded =
				typeof window !== "undefined" &&
				!!window.pagefind &&
				typeof window.pagefind.search === "function";
		};

		if (import.meta.env.DEV) {
			initializeSearch();
			return;
		}

		document.addEventListener("pagefindready", initializeSearch);
		document.addEventListener("pagefindloaderror", initializeSearch);

		const fallbackTimer = window.setTimeout(() => {
			if (!initialized) {
				initializeSearch();
			}
		}, 2000);

		return () => {
			document.removeEventListener("pagefindready", initializeSearch);
			document.removeEventListener("pagefindloaderror", initializeSearch);
			window.clearTimeout(fallbackTimer);
		};
	});

	$effect(() => {
		if (!initialized) return;

		const keyword = keywordDesktop || keywordMobile;
		const isDesktop = Boolean(keywordDesktop) || isDesktopSearchExpanded;

		clearTimeout(debounceTimer);
		if (keyword) {
			debounceTimer = setTimeout(() => {
				search(keyword, isDesktop);
			}, 250);
			return;
		}

		result = [];
		setPanelVisibility(false, isDesktop);
	});

	$effect(() => {
		if (typeof document === "undefined") return;
		const navbar = document.getElementById("navbar");
		navbar?.classList.toggle("is-searching", isDesktopSearchExpanded);
	});

	onDestroy(() => {
		if (typeof document !== "undefined") {
			document.getElementById("navbar")?.classList.remove("is-searching");
		}
		clearTimeout(blurTimer);
		clearTimeout(debounceTimer);
	});
</script>

<div class="hidden lg:block relative w-11 h-11 shrink-0">
	<div
		id="search-bar"
		class="flex items-center h-11 rounded-lg absolute right-0 top-0 shrink-0
			{isDesktopSearchExpanded ? 'search-bar-bg' : ''}
			{isDesktopSearchExpanded ? 'w-52' : 'w-11'}"
	>
		{#if isDesktopSearchExpanded}
			<svg
				viewBox="0 0 24 24"
				aria-hidden="true"
				class="absolute text-[1.25rem] pointer-events-none left-3 navbar-action-icon top-1/2 -translate-y-1/2 search-icon-color"
			>
				<path
					fill="currentColor"
					d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
				/>
			</svg>
			<input
				id="search-input-desktop"
				type="search"
				placeholder={searchLabel}
				bind:this={desktopSearchInput}
				bind:value={keywordDesktop}
				enterkeyhint="search"
				aria-label={searchLabel}
				aria-controls="search-results-list"
				aria-expanded={result.length > 0}
				onfocus={() => {
					clearTimeout(blurTimer);
					openDesktopSearch();
					search(keywordDesktop, true);
				}}
				onblur={handleBlur}
				onkeydown={handleSearchKeydown}
				class="transition-all pl-10 pr-3 text-sm bg-transparent outline-0
					h-full w-40 search-input-color"
			/>
		{:else}
			<button
				id="search-switch"
				type="button"
				class="btn-plain active:scale-90 w-11 h-11 rounded-lg"
				aria-label={searchLabel}
				aria-controls="search-panel"
				aria-expanded="false"
				onclick={openDesktopSearch}
			>
				<svg
					viewBox="0 0 24 24"
					aria-hidden="true"
					class="absolute text-[1.25rem] pointer-events-none left-1/2 -translate-x-1/2 navbar-action-icon top-1/2 -translate-y-1/2"
				>
					<path
						fill="currentColor"
						d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>

<div
	id="search-panel"
	class="float-panel float-panel-closed absolute md:w-120 top-20 left-4 md:left-[unset] right-4 z-50 search-panel shadow-2xl rounded-2xl p-2"
>
	<div
		id="search-bar-inside"
		class="flex relative lg:hidden transition-all items-center h-11 rounded-xl search-bar-bg"
		role="search"
	>
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true"
			class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto search-icon-color"
		>
			<path
				fill="currentColor"
				d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
			/>
		</svg>
		<input
			id="search-input-mobile"
			type="search"
			placeholder={searchLabel}
			bind:this={mobileSearchInput}
			bind:value={keywordMobile}
			enterkeyhint="search"
			aria-label={searchLabel}
			aria-controls="search-results-list"
			onkeydown={handleSearchKeydown}
			class="pl-10 absolute inset-0 text-sm bg-transparent outline-0 focus:w-60 search-input-color"
		/>
	</div>
	{#if result.length > 0}
		<ul
			id="search-results-list"
			class="mt-2 flex flex-col gap-1"
			aria-label={searchResultsLabel}
		>
			{#each result as item}
				<li>
					<a
						href={item.url}
						onclick={(e) => handleResultClick(e, item.url)}
						class="transition group block rounded-xl text-lg px-3 py-2 hover:bg-(--btn-plain-bg-hover) active:bg-(--btn-plain-bg-active)"
					>
						<div
							class="transition text-90 inline-flex font-bold group-hover:text-(--primary)"
						>
							{item.meta.title}<svg
								viewBox="0 0 24 24"
								aria-hidden="true"
								class="transition text-[0.75rem] translate-x-1 my-auto text-(--primary)"
							>
								<path
									fill="currentColor"
									d="M9.29 6.71a1 1 0 0 0 0 1.41L13.17 12l-3.88 3.88a1 1 0 1 0 1.41 1.41l4.59-4.59a1 1 0 0 0 0-1.41L10.7 6.7a1 1 0 0 0-1.41 0"
								/>
							</svg>
						</div>
						<div class="transition text-sm text-50">
							{@html item.excerpt}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	@reference "../styles/main.css";

	input:focus {
		outline: 0;
	}

	:global(.search-panel) {
		max-height: calc(100vh - 100px);
		overflow-y: auto;
		padding: 0.6rem;
	}

	.search-bar-bg {
		@apply bg-black/4 hover:bg-black/6 focus-within:bg-black/6 dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10;
		border: 1px solid color-mix(in oklch, currentColor 8%, transparent);
	}

	.search-icon-color {
		@apply text-black dark:text-white;
		opacity: 0.7;
	}

	.search-input-color {
		@apply text-black dark:text-white;
	}

	:global(.search-panel a) {
		border: 1px solid transparent;
	}

	:global(.search-panel a:hover) {
		border-color: color-mix(in oklch, currentColor 8%, transparent);
	}
</style>
