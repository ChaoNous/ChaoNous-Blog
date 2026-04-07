import { escapeHtml } from "./utils.js";

function renderKvList(container, data) {
	container.innerHTML = Object.entries(data)
		.map(
			([key, value]) => `
				<div class="kv-row">
					<div class="kv-key">${escapeHtml(key)}</div>
					<div>${escapeHtml(String(value))}</div>
				</div>
			`,
		)
		.join("");
}

export function createSettingsController({ dom, request }) {
	async function loadSettings() {
		const payload = await request("/api/admin/settings");
		renderKvList(dom.settingsSite, payload.site || {});
		renderKvList(dom.settingsComment, payload.comment || {});
		renderKvList(dom.settingsSecurity, payload.security || {});
		dom.sidebarMode.textContent = "直接发布";
		dom.dashboardMode.textContent = "直接发布";
	}

	return {
		loadSettings,
	};
}

