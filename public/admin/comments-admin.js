import { createJsonRequest, downloadExport } from "/admin/modules/api.js";
import { createBulkActionsController } from "/admin/modules/bulk-actions.js";
import { createCommentsListController } from "/admin/modules/comments-list.js";
import { createSessionController } from "/admin/modules/session.js";
import { createAdminState, pageMeta, storageKeys } from "/admin/modules/state.js";
import {
	escapeHtml,
	formatDate,
	formatNumber,
	setMessage,
} from "/admin/modules/utils.js";

const state = createAdminState();

const dom = {
	loginScreen: document.getElementById("login-screen"),
	adminApp: document.getElementById("admin-app"),
	loginForm: document.getElementById("login-form"),
	loginPasswordInput: document.getElementById("login-password"),
	loginSubmit: document.getElementById("login-submit"),
	loginMessage: document.getElementById("login-message"),
	appMessage: document.getElementById("app-message"),
	pageTitle: document.getElementById("page-title"),
	pageSubtitle: document.getElementById("page-subtitle"),
	themeToggle: document.getElementById("theme-toggle"),
	logoutButton: document.getElementById("logout-button"),
	metricCommentsTotal: document.getElementById("metric-comments-total"),
	metricPageviews: document.getElementById("metric-pageviews"),
	metricVisits: document.getElementById("metric-visits"),
	dashboardTrend: document.getElementById("dashboard-trend"),
	dashboardRecentComments: document.getElementById("dashboard-recent-comments"),
	dashboardHotPosts: document.getElementById("dashboard-hot-posts"),
	commentsSearchInput: document.getElementById("comments-search"),
	commentsList: document.getElementById("comments-list"),
	commentsPaginationMeta: document.getElementById("comments-pagination-meta"),
	commentsPrev: document.getElementById("comments-prev"),
	commentsNext: document.getElementById("comments-next"),
	commentsSelectionCount: document.getElementById("comments-selection-count"),
	commentsSelectPage: document.getElementById("comments-select-page"),
	commentsBulkDelete: document.getElementById("comments-bulk-delete"),
	analyticsTotalPv: document.getElementById("analytics-total-pv"),
	analyticsTotalVisits: document.getElementById("analytics-total-visits"),
	analyticsPageCount: document.getElementById("analytics-page-count"),
	analyticsTrend: document.getElementById("analytics-trend"),
	analyticsPages: document.getElementById("analytics-pages"),
};

const text = {
	switchToLight: "\u5207\u6362\u5230\u6d45\u8272",
	switchToDark: "\u5207\u6362\u5230\u6df1\u8272",
	noData: "\u6682\u65e0\u53ef\u7528\u6570\u636e\u3002",
	noRecentComments: "\u6682\u65e0\u8fd1\u671f\u8bc4\u8bba\u3002",
	noHotPosts: "\u6682\u65e0\u6587\u7ae0\u8bc4\u8bba\u6570\u636e\u3002",
	noAnalytics: "\u6682\u65e0\u8bbf\u95ee\u7edf\u8ba1\u6570\u636e\u3002",
	commentCountSuffix: "\u6761",
	backendLoaded: "\u540e\u53f0\u6570\u636e\u5df2\u52a0\u8f7d\u3002",
	refreshingDashboard: "\u6b63\u5728\u5237\u65b0\u770b\u677f\u2026",
	dashboardRefreshed: "\u770b\u677f\u5df2\u5237\u65b0\u3002",
	analyticsRefreshed: "\u7edf\u8ba1\u6570\u636e\u5df2\u5237\u65b0\u3002",
	commentsExportStarted: "\u8bc4\u8bba\u6570\u636e\u5df2\u5f00\u59cb\u5bfc\u51fa\u3002",
	analyticsExportStarted: "\u7edf\u8ba1\u6570\u636e\u5df2\u5f00\u59cb\u5bfc\u51fa\u3002",
};

function setTheme(theme) {
	const nextTheme = theme === "dark" ? "dark" : "light";
	state.theme = nextTheme;
	document.documentElement.setAttribute("data-theme", nextTheme);
	localStorage.setItem(storageKeys.theme, nextTheme);
	dom.themeToggle.textContent =
		nextTheme === "dark" ? text.switchToLight : text.switchToDark;
}

const sessionController = createSessionController({
	dom,
	setTheme,
	setMessage,
	resetSelection: () => commentsListController.resetSelection(),
});

const request = createJsonRequest({
	onUnauthorized: sessionController.handleUnauthorized,
});

function renderBarChart(container, items, key) {
	if (!items.length) {
		container.innerHTML = `<div class="message info">${text.noData}</div>`;
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

function renderRecentComments(items) {
	if (!items.length) {
		dom.dashboardRecentComments.innerHTML =
			`<div class="message info">${text.noRecentComments}</div>`;
		return;
	}

	dom.dashboardRecentComments.innerHTML = items
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

function renderHotPosts(items) {
	if (!items.length) {
		dom.dashboardHotPosts.innerHTML =
			`<div class="message info">${text.noHotPosts}</div>`;
		return;
	}

	dom.dashboardHotPosts.innerHTML = items
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

async function loadOverview() {
	const payload = await request("/api/admin/overview");
	dom.metricCommentsTotal.textContent = formatNumber(payload.commentSummary.total);
	dom.metricPageviews.textContent = formatNumber(payload.analyticsSummary.pageviews);
	dom.metricVisits.textContent = formatNumber(payload.analyticsSummary.visits);
	renderBarChart(dom.dashboardTrend, payload.commentTrend || [], "total");
	renderRecentComments(payload.recentComments || []);
	renderHotPosts(payload.hotPosts || []);
}

function renderAnalyticsPages(items) {
	if (!items.length) {
		dom.analyticsPages.innerHTML =
			`<div class="message info">${text.noAnalytics}</div>`;
		return;
	}

	dom.analyticsPages.innerHTML = items
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

async function loadAnalytics() {
	const payload = await request("/api/admin/analytics?limit=12");
	dom.analyticsTotalPv.textContent = formatNumber(payload.summary.pageviews);
	dom.analyticsTotalVisits.textContent = formatNumber(payload.summary.visits);
	dom.analyticsPageCount.textContent = formatNumber(payload.summary.pageCount);
	renderBarChart(dom.analyticsTrend, payload.recentTrend || [], "pageviews");
	renderAnalyticsPages(payload.pages || []);
}

function showView(view) {
	state.currentView = view;
	document.querySelectorAll(".nav-button").forEach((button) => {
		button.classList.toggle("active", button.dataset.view === view);
	});
	document.querySelectorAll(".page-section").forEach((section) => {
		section.classList.toggle("active", section.id === `view-${view}`);
	});
	dom.pageTitle.textContent = pageMeta[view].title;
	dom.pageSubtitle.textContent = pageMeta[view].subtitle;
}

async function refreshCommentsAndOverview(message) {
	await Promise.all([commentsListController.loadComments(), loadOverview()]);
	setMessage(dom.appMessage, message, "success");
}

const commentsListController = createCommentsListController({
	state,
	dom,
	request,
	setMessage,
	refreshCommentsAndOverview,
});

const bulkActionsController = createBulkActionsController({
	state,
	dom,
	request,
	setMessage,
	resetSelection: () => commentsListController.resetSelection(),
	refreshCommentsAndOverview,
});

async function bootstrapApp() {
	await Promise.all([
		loadOverview(),
		commentsListController.loadComments(),
		loadAnalytics(),
	]);
	showView(state.currentView);
	setMessage(dom.appMessage, text.backendLoaded, "success");
}

dom.loginForm.addEventListener("submit", (event) => {
	event.preventDefault();
	void sessionController.tryLogin(bootstrapApp);
});

dom.themeToggle.addEventListener("click", () => {
	setTheme(state.theme === "dark" ? "light" : "dark");
});

dom.logoutButton.addEventListener("click", () => {
	void sessionController.logout();
});

document.querySelectorAll(".nav-button").forEach((button) => {
	button.addEventListener("click", () => {
		showView(button.dataset.view);
	});
});

document.getElementById("dashboard-refresh").addEventListener("click", async () => {
	setMessage(dom.appMessage, text.refreshingDashboard, "info");
	try {
		await loadOverview();
		setMessage(dom.appMessage, text.dashboardRefreshed, "success");
	} catch (error) {
		setMessage(dom.appMessage, error.message, "error");
	}
});

document.getElementById("analytics-refresh").addEventListener("click", async () => {
	try {
		await loadAnalytics();
		setMessage(dom.appMessage, text.analyticsRefreshed, "success");
	} catch (error) {
		setMessage(dom.appMessage, error.message, "error");
	}
});

document.getElementById("export-comments").addEventListener("click", async () => {
	try {
		await downloadExport("comments");
		setMessage(dom.appMessage, text.commentsExportStarted, "success");
	} catch (error) {
		setMessage(dom.appMessage, error.message, "error");
	}
});

document.getElementById("export-analytics").addEventListener("click", async () => {
	try {
		await downloadExport("analytics");
		setMessage(dom.appMessage, text.analyticsExportStarted, "success");
	} catch (error) {
		setMessage(dom.appMessage, error.message, "error");
	}
});

commentsListController.bindEvents();
bulkActionsController.bindEvents();

window.addEventListener("DOMContentLoaded", () => {
	void sessionController.restoreSession(bootstrapApp);
});
