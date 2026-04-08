export function scheduleIdleTask(callback: () => void, timeout = 1200): void {
	if ("requestIdleCallback" in window) {
		window.requestIdleCallback(() => callback(), { timeout });
		return;
	}

	globalThis.setTimeout(callback, Math.min(timeout, 300));
}
