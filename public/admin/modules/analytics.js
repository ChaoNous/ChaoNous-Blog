import { escapeHtml, formatDate, formatNumber } from "./utils.js";

function renderBarChart(container, items, key, emptyMessage) {
	if (!items.length) {
		container.innerHTML = `<div class="message info">${emptyMessage}</div>`;
		return;
	}

	const max = Math.max(...items.map((item) => Number(item[key] || 0)), 1);
	container.innerHTML = items
		.map((item) => {
			const value = Number(item[key] || 0);
			const width = Math.max(6, Math.round((value / max) * 100));
			return `
				<div class="bar-row">
					<div>${escapeHtml(item.day || "-")}</div>
					<div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
					<div>${formatNumber(value)}</div>
				</div>
			`;
		})
		.join("");
}

function renderAnalyticsPages(container, items, text) {
	if (!items.length) {
		container.innerHTML = `<div class="message info">${text.noAnalytics}</div>`;
		return;
	}

	container.innerHTML = items
		.map(
			(item) => `
			<article class="page-row">
				<div class="page-row-header">
					<strong>${escapeHtml(item.postTitle || item.postSlug)}</strong>
					<span>${formatNumber(item.pageviews)} PV</span>
				</div>
				<div class="table-meta">${escapeHtml(item.postSlug)}</div>
				<div class="table-meta" style="margin-top: 0.5rem;">Visits ${formatNumber(item.visits)} / ${formatDate(item.updatedAt)}</div>
			</article>
		`,
		)
		.join("");
}

export function createAnalyticsController({ dom, request, text }) {
	async function loadAnalytics() {
		const payload = await request("/api/admin/analytics?limit=12");
		dom.analyticsTotalPv.textContent = formatNumber(payload.summary.pageviews);
		dom.analyticsTotalVisits.textContent = formatNumber(payload.summary.visits);
		dom.analyticsPageCount.textContent = formatNumber(payload.summary.pageCount);
		renderBarChart(dom.analyticsTrend, payload.recentTrend || [], "pageviews", text.noData);
		renderAnalyticsPages(dom.analyticsPages, payload.pages || [], text);
	}

	return {
		loadAnalytics,
	};
}
