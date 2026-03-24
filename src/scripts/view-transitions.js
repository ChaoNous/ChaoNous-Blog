import { registerPageScript } from "./page-lifecycle.js";

const supportsViewTransitions = "startViewTransition" in document;
const prefetchCache = new Map();
const PREFETCH_TIMEOUT = 2000;

async function prefetchPage(url) {
	if (prefetchCache.has(url)) return;

	try {
		const controller = new AbortController();
		const timeoutId = window.setTimeout(
			() => controller.abort(),
			PREFETCH_TIMEOUT,
		);

		const response = await fetch(url, {
			signal: controller.signal,
			credentials: "same-origin",
		});

		window.clearTimeout(timeoutId);

		if (response.ok) {
			const html = await response.text();
			prefetchCache.set(url, html);
		}
	} catch {
		// Ignore prefetch failures and fall back to normal navigation.
	}
}

function parseHTML(html) {
	return new DOMParser().parseFromString(html, "text/html");
}

function updatePage(doc) {
	const title = doc.querySelector("title");
	if (title) {
		document.title = title.textContent ?? document.title;
	}

	document.body.className = doc.body.className;

	const newMain = doc.querySelector("main");
	const oldMain = document.querySelector("main");
	if (newMain && oldMain) {
		oldMain.innerHTML = newMain.innerHTML;
	}

	doc.querySelectorAll('link[rel="stylesheet"]').forEach((newStyle) => {
		const href = newStyle.getAttribute("href");
		if (!href) return;

		if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
			document.head.appendChild(newStyle.cloneNode(true));
		}
	});
}

async function navigateTo(url, skipTransition = false) {
	const urlObj = new URL(url, window.location.origin);
	if (urlObj.pathname === window.location.pathname && urlObj.hash) {
		return;
	}

	let html = prefetchCache.get(url);
	if (!html) {
		try {
			const response = await fetch(url, { credentials: "same-origin" });
			if (!response.ok) {
				window.location.href = url;
				return;
			}
			html = await response.text();
		} catch {
			window.location.href = url;
			return;
		}
	}

	const doc = parseHTML(html);

	if (supportsViewTransitions && !skipTransition) {
		document.startViewTransition(() => {
			updatePage(doc);
		});
	} else {
		updatePage(doc);
	}

	window.history.pushState({}, "", url);
	window.scrollTo({ top: 0, behavior: "instant" });

	document.dispatchEvent(
		new CustomEvent("page:navigate", {
			detail: { url, title: doc.title },
		}),
	);
}

function shouldPrefetchLink(link) {
	const href = link.getAttribute("href");
	return (
		!!href &&
		!href.startsWith("http") &&
		!href.startsWith("//") &&
		!href.startsWith("#") &&
		!link.closest(".no-prefetch")
	);
}

function initNavigation() {
	document.addEventListener(
		"click",
		(event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;

			const link = target.closest("a[href]");
			if (!link) return;

			const href = link.getAttribute("href");
			if (
				!href ||
				href.startsWith("http") ||
				href.startsWith("//") ||
				href.startsWith("#") ||
				href.startsWith("javascript:") ||
				link.getAttribute("target") === "_blank" ||
				link.hasAttribute("download") ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey
			) {
				return;
			}

			if (link.closest(".no-transition")) return;

			event.preventDefault();
			navigateTo(new URL(href, window.location.origin).href);
		},
		true,
	);

	window.addEventListener("popstate", (event) => {
		event.preventDefault();
		const url = window.location.href;

		if (prefetchCache.has(url)) {
			const doc = parseHTML(prefetchCache.get(url));
			if (supportsViewTransitions) {
				document.startViewTransition(() => {
					updatePage(doc);
				});
			} else {
				updatePage(doc);
			}
			return;
		}

		window.location.reload();
	});

	let prefetchTimer = null;
	document.addEventListener(
		"mouseover",
		(event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;

			const link = target.closest("a[href]");
			if (!link || !shouldPrefetchLink(link)) return;

			const url = new URL(link.getAttribute("href"), window.location.origin)
				.href;
			if (url === window.location.href) return;

			window.clearTimeout(prefetchTimer);
			prefetchTimer = window.setTimeout(() => {
				prefetchPage(url);
			}, 100);
		},
		{ passive: true },
	);
}

registerPageScript("view-transitions-navigation", {
	init() {
		initNavigation();
	},
});

export { navigateTo, prefetchPage };
