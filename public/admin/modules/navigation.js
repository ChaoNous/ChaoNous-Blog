export function createNavigationController({ state, dom, pageMeta }) {
	function showView(view) {
		state.currentView = view;
		document.querySelectorAll(".nav-button").forEach((button) => {
			button.classList.toggle("active", button.dataset.view === view);
		});
		document.querySelectorAll(".page-section").forEach((section) => {
			section.classList.toggle("active", section.id === `view-${view}`);
		});

		const meta = pageMeta[view] || pageMeta.dashboard;
		dom.pageTitle.textContent = meta.title;
		dom.pageSubtitle.textContent = meta.subtitle;
	}

	function bindEvents() {
		document.querySelectorAll(".nav-button").forEach((button) => {
			button.addEventListener("click", () => {
				showView(button.dataset.view);
			});
		});
	}

	return {
		showView,
		bindEvents,
	};
}
