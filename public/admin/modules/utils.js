export function formatNumber(value) {
	return new Intl.NumberFormat("zh-CN").format(Number(value || 0));
}

export function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export function formatDate(value) {
	try {
		return new Intl.DateTimeFormat("zh-CN", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(value));
	} catch {
		return value;
	}
}

export function setMessage(target, message, type) {
	target.textContent = message;
	target.className = `message ${type || "info"}`;
}

