/**
 * 轻量级 View Transitions 导航脚本
 * 替代 Swup，使用原生 View Transitions API
 * 体积：~2KB vs Swup ~15KB+
 */

// 检查浏览器是否支持 View Transitions
const supportsViewTransitions = "startViewTransition" in document;

// 预加载缓存
const prefetchCache = new Map();
const PREFETCH_TIMEOUT = 2000;

/**
 * 预加载页面
 */
async function prefetchPage(url) {
	if (prefetchCache.has(url)) return;

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			PREFETCH_TIMEOUT,
		);

		const response = await fetch(url, {
			signal: controller.signal,
			credentials: "same-origin",
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			const html = await response.text();
			prefetchCache.set(url, html);
		}
	} catch (error) {
		// 忽略预加载错误
	}
}

/**
 * 解析 HTML 并提取主要内容
 */
function parseHTML(html) {
	const parser = new DOMParser();
	return parser.parseFromString(html, "text/html");
}

/**
 * 更新页面内容
 */
function updatePage(doc) {
	// 更新 title
	const title = doc.querySelector("title");
	if (title) document.title = title.textContent;

	// 更新 body class
	document.body.className = doc.body.className;

	// 更新 main 内容
	const newMain = doc.querySelector("main");
	const oldMain = document.querySelector("main");
	if (newMain && oldMain) {
		oldMain.innerHTML = newMain.innerHTML;
	}

	// 更新 head 中的关键元素
	const newStyles = doc.querySelectorAll('link[rel="stylesheet"]');
	const oldStyles = document.querySelectorAll('link[rel="stylesheet"]');
	// 只添加新的样式表
	newStyles.forEach((newStyle) => {
		const href = newStyle.getAttribute("href");
		if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
			document.head.appendChild(newStyle.cloneNode(true));
		}
	});
}

/**
 * 导航到新页面
 */
async function navigateTo(url, skipTransition = false) {
	// 如果是锚点链接，让浏览器原生处理
	const urlObj = new URL(url, window.location.origin);
	if (urlObj.pathname === window.location.pathname && urlObj.hash) {
		return;
	}

	// 获取页面内容
	let html = prefetchCache.get(url);
	if (!html) {
		try {
			const response = await fetch(url, { credentials: "same-origin" });
			if (!response.ok) {
				window.location.href = url;
				return;
			}
			html = await response.text();
		} catch (error) {
			window.location.href = url;
			return;
		}
	}

	const doc = parseHTML(html);

	// 使用 View Transitions API
	if (supportsViewTransitions && !skipTransition) {
		document.startViewTransition(() => {
			updatePage(doc);
		});
	} else {
		// 降级处理
		updatePage(doc);
	}

	// 更新 URL
	window.history.pushState({}, "", url);

	// 滚动到顶部
	window.scrollTo({ top: 0, behavior: "instant" });

	// 触发自定义事件，供其他脚本监听
	document.dispatchEvent(
		new CustomEvent("page:navigate", {
			detail: { url, title: doc.title },
		}),
	);
}

/**
 * 初始化导航
 */
function initNavigation() {
	// 拦截内部链接点击
	document.addEventListener(
		"click",
		(e) => {
			const link = e.target.closest("a[href]");
			if (!link) return;

			const href = link.getAttribute("href");

			// 忽略外部链接、下载链接、新窗口打开
			if (
				!href ||
				href.startsWith("http") ||
				href.startsWith("//") ||
				href.startsWith("#") ||
				href.startsWith("javascript:") ||
				link.getAttribute("target") === "_blank" ||
				link.hasAttribute("download") ||
				e.metaKey ||
				e.ctrlKey ||
				e.shiftKey
			) {
				return;
			}

			// 忽略特殊链接
			if (link.closest(".no-transition")) return;

			e.preventDefault();

			const url = new URL(href, window.location.origin).href;
			navigateTo(url);
		},
		true,
	);

	// 处理浏览器前进/后退
	window.addEventListener("popstate", (e) => {
		e.preventDefault();
		const url = window.location.href;

		// 检查缓存
		if (prefetchCache.has(url)) {
			const doc = parseHTML(prefetchCache.get(url));
			if (supportsViewTransitions) {
				document.startViewTransition(() => {
					updatePage(doc);
				});
			} else {
				updatePage(doc);
			}
		} else {
			window.location.reload();
		}
	});

	// 悬停预加载
	let prefetchTimer = null;
	document.addEventListener(
		"mouseover",
		(e) => {
			const link = e.target.closest("a[href]");
			if (!link) return;

			const href = link.getAttribute("href");
			if (!href || href.startsWith("http") || href.startsWith("#"))
				return;

			const url = new URL(href, window.location.origin).href;
			if (url === window.location.href) return;

			// 延迟预加载，避免鼠标快速滑过时不必要的请求
			clearTimeout(prefetchTimer);
			prefetchTimer = setTimeout(() => {
				prefetchPage(url);
			}, 100);
		},
		{ passive: true },
	);

	// 视口可见预加载
	if ("IntersectionObserver" in window) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const link = entry.target;
						const href = link.getAttribute("href");
						if (
							href &&
							!href.startsWith("http") &&
							!href.startsWith("#")
						) {
							const url = new URL(href, window.location.origin)
								.href;
							prefetchPage(url);
						}
						observer.unobserve(link);
					}
				});
			},
			{ threshold: 0.1 },
		);

		// 观察视口内的链接
		const observeLinks = () => {
			document.querySelectorAll("a[href]").forEach((link) => {
				const href = link.getAttribute("href");
				if (
					href &&
					!href.startsWith("http") &&
					!href.startsWith("#") &&
					!link.closest(".no-prefetch")
				) {
					observer.observe(link);
				}
			});
		};

		observeLinks();

		// 页面导航后重新观察
		document.addEventListener("page:navigate", () => {
			setTimeout(observeLinks, 100);
		});
	}
}

// 自动初始化
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initNavigation);
} else {
	initNavigation();
}

// 导出供外部使用
export { navigateTo, prefetchPage };
