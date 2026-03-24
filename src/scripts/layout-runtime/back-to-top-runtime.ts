export function syncBackToTopVisibility(
	scrollTop: number,
	bannerHeight: number,
) {
	const backToTopBtn = document.getElementById("back-to-top-btn");
	if (!backToTopBtn) return;

	const contentWrapper = document.getElementById("content-wrapper");
	let showBackToTopThreshold = bannerHeight + 100;

	if (contentWrapper) {
		const rect = contentWrapper.getBoundingClientRect();
		const absoluteTop = rect.top + scrollTop;
		showBackToTopThreshold = absoluteTop + window.innerHeight / 4;
	}

	if (scrollTop > showBackToTopThreshold) {
		backToTopBtn.classList.remove("hide");
	} else {
		backToTopBtn.classList.add("hide");
	}
}
