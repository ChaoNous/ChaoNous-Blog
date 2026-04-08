type NavbarWindow = Window & {
	semifullScrollHandler?: () => void;
	initSemifullScrollDetection?: () => () => void;
};

export function initSemifullScrollDetection() {
	const navbar = document.getElementById("navbar");
	if (!(navbar instanceof HTMLElement)) return () => {};
	const navbarElement = navbar;
	const navbarWindow = window as NavbarWindow;

	if (navbarWindow.semifullScrollHandler) {
		window.removeEventListener("scroll", navbarWindow.semifullScrollHandler);
		navbarWindow.semifullScrollHandler = undefined;
	}

	const isHomePage = navbarElement.dataset.isHome === "true";

	if (!isHomePage) {
		navbarElement.classList.add("scrolled");
		return () => {
			navbarElement.classList.remove("scrolled");
		};
	}

	let ticking = false;

	function updateNavbarState() {
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const threshold = 50;

		if (scrollTop > threshold) {
			navbarElement.classList.add("scrolled");
		} else {
			navbarElement.classList.remove("scrolled");
		}

		ticking = false;
	}

	function requestTick() {
		if (!ticking) {
			requestAnimationFrame(updateNavbarState);
			ticking = true;
		}
	}

	navbarWindow.semifullScrollHandler = requestTick;
	window.addEventListener("scroll", requestTick, { passive: true });
	updateNavbarState();

	return () => {
		window.removeEventListener("scroll", requestTick);
		if (navbarWindow.semifullScrollHandler === requestTick) {
			navbarWindow.semifullScrollHandler = undefined;
		}
	};
}

(window as NavbarWindow).initSemifullScrollDetection =
	initSemifullScrollDetection;
