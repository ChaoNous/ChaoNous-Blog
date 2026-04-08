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

function renderRecentComments(container, items, text) {
	if (!items.length) {
		container.innerHTML = `<div class="message info">${text.noRecentComments}</div>`;
		return;
	}

	container.innerHTML = items
		.map(
			(item) => `
			<article class="comment-item">
				<div class="comment-item-header">
					<strong>${escapeHtml(item.authorName)}</strong>
					<span class="table-meta">${formatDate(item.createdAt)}</span>
				</div>
				<div>${escapeHtml(item.postTitle || item.postSlug)}</div>
				<div class="table-meta">${escapeHtml(item.content).slice(0, 88)}</div>
			</article>
		`,
		)
		.join("");
}

function renderHotPosts(container, items, text) {
	if (!items.length) {
		container.innerHTML = `<div class="message info">${text.noHotPosts}</div>`;
		return;
	}

	container.innerHTML = items
		.map(
			(item) => `
			<div class="info-item">
				<div class="page-row-header">
					<strong>${escapeHtml(item.postTitle || item.postSlug)}</strong>
					<span>${formatNumber(item.commentCount)} ${text.commentCountSuffix}</span>
				</div>
				<div class="table-meta">${escapeHtml(item.postSlug)}</div>
			</div>
		`,
		)
		.join("");
}

export function createDashboardController({ dom, request, text }) {
	async function loadOverview() {
		const payload = await request("/api/admin/overview");
		dom.metricCommentsTotal.textContent = formatNumber(payload.commentSummary.total);
		dom.metricPageviews.textContent = formatNumber(payload.analyticsSummary.pageviews);
		dom.metricVisits.textContent = formatNumber(payload.analyticsSummary.visits);
		renderBarChart(dom.dashboardTrend, payload.commentTrend || [], "total", text.noData);
		renderRecentComments(dom.dashboardRecentComments, payload.recentComments || [], text);
		renderHotPosts(dom.dashboardHotPosts, payload.hotPosts || [], text);
	}

	return {
		loadOverview,
	};
}
