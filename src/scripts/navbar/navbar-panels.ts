import { registerPageScript } from "../page-lifecycle.ts";
import { initSemifullScrollDetection } from "./navbar-scroll";

type NavbarPanelId = "display-setting" | "nav-menu-panel";

async function togglePanel(panelId: NavbarPanelId) {
	const { panelManager } = await import("../../utils/panel-manager");
	await panelManager.togglePanel(panelId);
}

function wirePanelButton(
	buttonId: string,
	panelId: NavbarPanelId,
	cleanups: Array<() => void>,
) {
	const button = document.getElementById(buttonId);
	if (!(button instanceof HTMLElement)) return;

	const handleClick = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		try {
			await togglePanel(panelId);
		} catch (error) {
			console.error("Failed to load panel manager:", error);
			document.getElementById(panelId)?.classList.toggle("float-panel-closed");
		}
	};

	button.addEventListener("click", handleClick);
	cleanups.push(() => button.removeEventListener("click", handleClick));
}

function wireMobileSearchButton(cleanups: Array<() => void>) {
	const mobileSearchBtn = document.getElementById("mobile-search-switch");
	if (!(mobileSearchBtn instanceof HTMLElement)) return;

	const handleMobileSearch = async (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		try {
			const { panelManager } = await import("../../utils/panel-manager");
			await panelManager.togglePanel("search-panel", true);
		} catch (error) {
			console.error("Failed to open search panel:", error);
		}
	};

	mobileSearchBtn.addEventListener("click", handleMobileSearch);
	cleanups.push(() =>
		mobileSearchBtn.removeEventListener("click", handleMobileSearch),
	);
}

registerPageScript("navbar-interactions", {
	shouldRun() {
		return document.getElementById("navbar") !== null;
	},
	init() {
		const cleanups: Array<() => void> = [];

		wirePanelButton("display-settings-switch", "display-setting", cleanups);
		wirePanelButton("nav-menu-switch", "nav-menu-panel", cleanups);
		wireMobileSearchButton(cleanups);

		const cleanupSemifullScrollDetection = initSemifullScrollDetection();
		cleanups.push(cleanupSemifullScrollDetection);

		return () => {
			cleanups.forEach((cleanup) => cleanup());
		};
	},
});
