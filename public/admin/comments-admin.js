import { createJsonRequest, downloadExport } from "/admin/modules/api.js";
import { createAnalyticsController } from "/admin/modules/analytics.js";
import { createBulkActionsController } from "/admin/modules/bulk-actions.js";
import { createCommentsListController } from "/admin/modules/comments-list.js";
import { adminText, pageMeta } from "/admin/modules/copy.js";
import { createDashboardController } from "/admin/modules/dashboard.js";
import { createNavigationController } from "/admin/modules/navigation.js";
import { createSessionController } from "/admin/modules/session.js";
import { createAdminState, storageKeys } from "/admin/modules/state.js";
import { setMessage } from "/admin/modules/utils.js";

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

function setTheme(theme) {
	const nextTheme = theme === "dark" ? "dark" : "light";
	state.theme = nextTheme;
	document.documentElement.setAttribute("data-theme", nextTheme);
	localStorage.setItem(storageKeys.theme, nextTheme);
	dom.themeToggle.textContent =
		nextTheme === "dark" ? adminText.switchToLight : adminText.switchToDark;
}

let commentsListController;

const sessionController = createSessionController({
	dom,
	setTheme,
	setMessage,
	resetSelection: () => commentsListController?.resetSelection(),
});

const request = createJsonRequest({
	onUnauthorized: sessionController.handleUnauthorized,
});

const dashboardController = createDashboardController({
	dom,
	request,
	text: adminText,
});

const analyticsController = createAnalyticsController({
	dom,
	request,
	text: adminText,
});

const navigationController = createNavigationController({
	state,
	dom,
	pageMeta,
});

async function refreshCommentsAndOverview(message) {
	await Promise.all([
		commentsListController.loadComments(),
		dashboardController.loadOverview(),
	]);
	setMessage(dom.appMessage, message, "success");
}

commentsListController = createCommentsListController({
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
		dashboardController.loadOverview(),
		commentsListController.loadComments(),
		analyticsController.loadAnalytics(),
	]);
	navigationController.showView(state.currentView);
	setMessage(dom.appMessage, adminText.backendLoaded, "success");
}

function bindShellActions() {
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

	document.getElementById("dashboard-refresh").addEventListener("click", async () => {
		setMessage(dom.appMessage, adminText.refreshingDashboard, "info");
		try {
			await dashboardController.loadOverview();
			setMessage(dom.appMessage, adminText.dashboardRefreshed, "success");
		} catch (error) {
			setMessage(dom.appMessage, error.message, "error");
		}
	});

	document.getElementById("analytics-refresh").addEventListener("click", async () => {
		try {
			await analyticsController.loadAnalytics();
			setMessage(dom.appMessage, adminText.analyticsRefreshed, "success");
		} catch (error) {
			setMessage(dom.appMessage, error.message, "error");
		}
	});

	document.getElementById("export-comments").addEventListener("click", async () => {
		try {
			await downloadExport("comments");
			setMessage(dom.appMessage, adminText.commentsExportStarted, "success");
		} catch (error) {
			setMessage(dom.appMessage, error.message, "error");
		}
	});

	document.getElementById("export-analytics").addEventListener("click", async () => {
		try {
			await downloadExport("analytics");
			setMessage(dom.appMessage, adminText.analyticsExportStarted, "success");
		} catch (error) {
			setMessage(dom.appMessage, error.message, "error");
		}
	});
}

navigationController.bindEvents();
commentsListController.bindEvents();
bulkActionsController.bindEvents();
bindShellActions();

window.addEventListener("DOMContentLoaded", () => {
	void sessionController.restoreSession(bootstrapApp);
});
