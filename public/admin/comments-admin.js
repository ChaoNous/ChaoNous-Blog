(function () {
	const storageKeys = {
		password: "cnc-admin-password",
		apiBaseUrl: "cnc-admin-api-base-url",
		theme: "cnc-admin-theme",
	};

	const state = {
		password: "",
		apiBaseUrl: "",
		theme: "light",
		currentView: "dashboard",
		commentsPage: 1,
		commentsTotalPages: 0,
		commentsSearch: "",
	};

	const loginScreen = document.getElementById("login-screen");
	const adminApp = document.getElementById("admin-app");
	const loginForm = document.getElementById("login-form");
	const loginApiInput = document.getElementById("login-api");
	const loginPasswordInput = document.getElementById("login-password");
	const loginSubmit = document.getElementById("login-submit");
	const loginMessage = document.getElementById("login-message");
	const appMessage = document.getElementById("app-message");
	const pageTitle = document.getElementById("page-title");
	const pageSubtitle = document.getElementById("page-subtitle");
	const sidebarMode = document.getElementById("sidebar-mode");
	const dashboardMode = document.getElementById("dashboard-mode");
	const themeToggle = document.getElementById("theme-toggle");
	const logoutButton = document.getElementById("logout-button");

	const metricCommentsTotal = document.getElementById("metric-comments-total");
	const metricPageviews = document.getElementById("metric-pageviews");
	const metricVisits = document.getElementById("metric-visits");
	const dashboardTrend = document.getElementById("dashboard-trend");
	const dashboardRecentComments = document.getElementById("dashboard-recent-comments");
	const dashboardHotPosts = document.getElementById("dashboard-hot-posts");

	const commentsSearchInput = document.getElementById("comments-search");
	const commentsList = document.getElementById("comments-list");
	const commentsPaginationMeta = document.getElementById("comments-pagination-meta");
	const commentsPrev = document.getElementById("comments-prev");
	const commentsNext = document.getElementById("comments-next");

	const analyticsTotalPv = document.getElementById("analytics-total-pv");
	const analyticsTotalVisits = document.getElementById("analytics-total-visits");
	const analyticsPageCount = document.getElementById("analytics-page-count");
	const analyticsTrend = document.getElementById("analytics-trend");
	const analyticsPages = document.getElementById("analytics-pages");

	const settingsSite = document.getElementById("settings-site");
	const settingsComment = document.getElementById("settings-comment");
	const settingsSecurity = document.getElementById("settings-security");

	const pageMeta = {
		dashboard: {
			title: "\u6570\u636e\u770b\u677f",
			subtitle:
				"\u4ee5\u76f4\u63a5\u53d1\u5e03\u6a21\u5f0f\u67e5\u770b\u5f53\u524d\u5168\u90e8\u8bc4\u8bba\u548c\u8fd1\u671f\u8d8b\u52bf\u3002",
		},
		comments: {
			title: "\u8bc4\u8bba\u7ba1\u7406",
			subtitle:
				"\u6240\u6709\u8bc4\u8bba\u90fd\u5df2\u76f4\u63a5\u53d1\u5e03\uff0c\u8fd9\u91cc\u7528\u4e8e\u641c\u7d22\u548c\u5206\u9875\u67e5\u770b\u3002",
		},
		analytics: {
			title: "\u8bbf\u95ee\u7edf\u8ba1",
			subtitle:
				"\u67e5\u770b\u7ad9\u70b9 PV / Visits \u548c\u70ed\u95e8\u9875\u9762\u6392\u884c\u3002",
		},
		settings: {
			title: "\u7ad9\u70b9\u8bbe\u7f6e",
			subtitle:
				"\u5c06\u5f53\u524d\u76f4\u63a5\u53d1\u5e03\u7b56\u7565\u3001\u7ebf\u7a0b\u4e3b\u952e\u548c\u9274\u6743\u65b9\u5f0f\u96c6\u4e2d\u5c55\u793a\u3002",
		},
		data: {
			title: "\u6570\u636e\u7ba1\u7406",
			subtitle:
				"\u5bfc\u51fa\u8bc4\u8bba\u548c\u8bbf\u95ee\u7edf\u8ba1\u6570\u636e\uff0c\u7528\u4e8e\u5907\u4efd\u6216\u8fc1\u79fb\u3002",
		},
	};

	function setTheme(theme) {
		const nextTheme = theme === "dark" ? "dark" : "light";
		state.theme = nextTheme;
		document.documentElement.setAttribute("data-theme", nextTheme);
		localStorage.setItem(storageKeys.theme, nextTheme);
		themeToggle.textContent =
			nextTheme === "dark"
				? "\u5207\u6362\u5230\u6d45\u8272"
				: "\u5207\u6362\u5230\u6df1\u8272";
	}

	function formatNumber(value) {
		return new Intl.NumberFormat("zh-CN").format(Number(value || 0));
	}

	function escapeHtml(value) {
		return String(value)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;");
	}

	function formatDate(value) {
		try {
			return new Intl.DateTimeFormat("zh-CN", {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(new Date(value));
		} catch {
			return value;
		}
	}

	function setMessage(target, message, type) {
		target.textContent = message;
		target.className = `message ${type || "info"}`;
	}

	function normalizeBaseUrl(value) {
		return (value || "").trim().replace(/\/+$/, "");
	}

	async function request(path, options) {
		const response = await fetch(`${state.apiBaseUrl}${path}`, {
			...options,
			headers: {
				Accept: "application/json",
				"x-comment-admin-password": state.password,
				...(options && options.headers ? options.headers : {}),
			},
		});

		if (!response.ok) {
			let message = "\u8bf7\u6c42\u5931\u8d25\u3002";
			try {
				const payload = await response.json();
				message = payload.message || message;
			} catch {
				/* ignore */
			}
			throw new Error(message);
		}

		return response.json();
	}

	function renderBarChart(container, items, key) {
		if (!items.length) {
			container.innerHTML = `<div class="message info">\u6682\u65e0\u53ef\u7528\u6570\u636e\u3002</div>`;
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
			dashboardRecentComments.innerHTML =
				'<div class="message info">\u6682\u65e0\u8fd1\u671f\u8bc4\u8bba\u3002</div>';
			return;
		}

		dashboardRecentComments.innerHTML = items
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
			dashboardHotPosts.innerHTML =
				'<div class="message info">\u6682\u65e0\u6587\u7ae0\u8bc4\u8bba\u6570\u636e\u3002</div>';
			return;
		}

		dashboardHotPosts.innerHTML = items
			.map(
				(item) => `
				<div class="info-item">
					<div class="page-row-header">
						<strong>${escapeHtml(item.postTitle || item.postSlug)}</strong>
						<span>${formatNumber(item.commentCount)} \u6761</span>
					</div>
					<div class="table-meta">${escapeHtml(item.postSlug)}</div>
				</div>
			`,
			)
			.join("");
	}

	async function loadOverview() {
		const payload = await request("/api/admin/overview");
		metricCommentsTotal.textContent = formatNumber(payload.commentSummary.total);
		metricPageviews.textContent = formatNumber(payload.analyticsSummary.pageviews);
		metricVisits.textContent = formatNumber(payload.analyticsSummary.visits);
		renderBarChart(dashboardTrend, payload.commentTrend || [], "total");
		renderRecentComments(payload.recentComments || []);
		renderHotPosts(payload.hotPosts || []);
	}

	function renderComments(items) {
		if (!items.length) {
			commentsList.innerHTML =
				'<div class="message info">\u6ca1\u6709\u5339\u914d\u7684\u8bc4\u8bba\u3002</div>';
			return;
		}

		commentsList.innerHTML = items
			.map(
				(item) => `
				<article class="comment-row" data-id="${item.id}">
					<div class="comment-row-header">
						<div>
							<strong>${escapeHtml(item.authorName)}</strong>
							<span class="table-meta">&nbsp;${escapeHtml(item.postTitle || item.postSlug)}</span>
						</div>
						<div class="table-meta">${formatDate(item.createdAt)}</div>
					</div>
					<div>${escapeHtml(item.content).replaceAll("\n", "<br />")}</div>
					<div class="table-meta" style="margin-top: 0.65rem;">${escapeHtml(item.postSlug)}</div>
				</article>
			`,
			)
			.join("");
	}

	async function loadComments() {
		const params = new URLSearchParams({
			page: String(state.commentsPage),
			limit: "12",
		});

		if (state.commentsSearch) {
			params.set("search", state.commentsSearch);
		}

		commentsList.innerHTML =
			'<div class="message info">\u6b63\u5728\u52a0\u8f7d\u8bc4\u8bba\u2026</div>';
		const payload = await request(`/api/admin/comments?${params.toString()}`);
		state.commentsTotalPages = Number(payload.pagination.total || 0);
		renderComments(payload.data || []);
		commentsPaginationMeta.textContent =
			`\u7b2c ${payload.pagination.page} / ${Math.max(payload.pagination.total, 1)} \u9875\uff0c` +
			` \u5171 ${formatNumber(payload.pagination.totalCount)} \u6761\u8bc4\u8bba`;
		commentsPrev.disabled = state.commentsPage <= 1;
		commentsNext.disabled =
			state.commentsTotalPages === 0 ||
			state.commentsPage >= state.commentsTotalPages;
	}

	function renderAnalyticsPages(items) {
		if (!items.length) {
			analyticsPages.innerHTML =
				'<div class="message info">\u6682\u65e0\u8bbf\u95ee\u7edf\u8ba1\u6570\u636e\u3002</div>';
			return;
		}

		analyticsPages.innerHTML = items
			.map(
				(item) => `
				<article class="page-row">
					<div class="page-row-header">
						<strong>${escapeHtml(item.postTitle || item.postSlug)}</strong>
						<span>${formatNumber(item.pageviews)} PV</span>
					</div>
					<div class="table-meta">${escapeHtml(item.postSlug)}</div>
					<div class="table-meta" style="margin-top: 0.5rem;">Visits ${formatNumber(item.visits)} · ${formatDate(item.updatedAt)}</div>
				</article>
			`,
			)
			.join("");
	}

	async function loadAnalytics() {
		const payload = await request("/api/admin/analytics?limit=12");
		analyticsTotalPv.textContent = formatNumber(payload.summary.pageviews);
		analyticsTotalVisits.textContent = formatNumber(payload.summary.visits);
		analyticsPageCount.textContent = formatNumber(payload.summary.pageCount);
		renderBarChart(analyticsTrend, payload.recentTrend || [], "pageviews");
		renderAnalyticsPages(payload.pages || []);
	}

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

	async function loadSettings() {
		const payload = await request("/api/admin/settings");
		renderKvList(settingsSite, payload.site || {});
		renderKvList(settingsComment, payload.comment || {});
		renderKvList(settingsSecurity, payload.security || {});
		sidebarMode.textContent = "\u76f4\u63a5\u53d1\u5e03";
		dashboardMode.textContent = "\u76f4\u63a5\u53d1\u5e03";
	}

	async function downloadExport(type) {
		const response = await fetch(
			`${state.apiBaseUrl}/api/admin/export?type=${encodeURIComponent(type)}`,
			{
				headers: {
					"x-comment-admin-password": state.password,
				},
			},
		);
		if (!response.ok) {
			throw new Error("\u5bfc\u51fa\u5931\u8d25\u3002");
		}
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download =
			type === "analytics"
				? "chaonous-analytics-export.json"
				: "chaonous-comments-export.json";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}

	function showView(view) {
		state.currentView = view;
		document.querySelectorAll(".nav-button").forEach((button) => {
			button.classList.toggle("active", button.dataset.view === view);
		});
		document.querySelectorAll(".page-section").forEach((section) => {
			section.classList.toggle("active", section.id === `view-${view}`);
		});
		pageTitle.textContent = pageMeta[view].title;
		pageSubtitle.textContent = pageMeta[view].subtitle;
	}

	function setAuthenticated(isAuthenticated) {
		loginScreen.classList.toggle("hidden", isAuthenticated);
		adminApp.classList.toggle("hidden", !isAuthenticated);
	}

	async function bootstrapApp() {
		await Promise.all([loadOverview(), loadComments(), loadAnalytics(), loadSettings()]);
		showView(state.currentView);
		setMessage(appMessage, "\u540e\u53f0\u6570\u636e\u5df2\u52a0\u8f7d\u3002", "success");
	}

	async function tryLogin() {
		state.password = loginPasswordInput.value.trim();
		state.apiBaseUrl = normalizeBaseUrl(loginApiInput.value) || window.location.origin;

		if (!state.password) {
			setMessage(loginMessage, "\u8bf7\u5148\u8f93\u5165\u540e\u53f0\u5bc6\u7801\u3002", "error");
			return;
		}

		loginSubmit.disabled = true;
		setMessage(loginMessage, "\u6b63\u5728\u9a8c\u8bc1\u540e\u53f0\u5bc6\u7801\u2026", "info");

		try {
			await request("/api/admin/overview");
			sessionStorage.setItem(storageKeys.password, state.password);
			localStorage.setItem(storageKeys.apiBaseUrl, state.apiBaseUrl);
			setAuthenticated(true);
			await bootstrapApp();
		} catch (error) {
			setMessage(
				loginMessage,
				error instanceof Error ? error.message : "\u767b\u5f55\u5931\u8d25\u3002",
				"error",
			);
		} finally {
			loginSubmit.disabled = false;
		}
	}

	function logout() {
		sessionStorage.removeItem(storageKeys.password);
		state.password = "";
		loginPasswordInput.value = "";
		setAuthenticated(false);
		setMessage(loginMessage, "\u5df2\u9000\u51fa\u3002", "info");
	}

	async function restoreSession() {
		const savedTheme = localStorage.getItem(storageKeys.theme) || "light";
		setTheme(savedTheme);

		const savedApiBaseUrl =
			localStorage.getItem(storageKeys.apiBaseUrl) || window.location.origin;
		loginApiInput.value = savedApiBaseUrl;
		state.apiBaseUrl = normalizeBaseUrl(savedApiBaseUrl);

		const savedPassword = sessionStorage.getItem(storageKeys.password) || "";
		if (!savedPassword) {
			setAuthenticated(false);
			return;
		}

		state.password = savedPassword;
		loginPasswordInput.value = savedPassword;

		try {
			await request("/api/admin/overview");
			setAuthenticated(true);
			await bootstrapApp();
		} catch {
			logout();
		}
	}

	loginForm.addEventListener("submit", (event) => {
		event.preventDefault();
		void tryLogin();
	});

	themeToggle.addEventListener("click", () => {
		setTheme(state.theme === "dark" ? "light" : "dark");
	});

	logoutButton.addEventListener("click", logout);

	document.querySelectorAll(".nav-button").forEach((button) => {
		button.addEventListener("click", () => {
			showView(button.dataset.view);
		});
	});

	document.getElementById("dashboard-refresh").addEventListener("click", async () => {
		setMessage(appMessage, "\u6b63\u5728\u5237\u65b0\u770b\u677f\u2026", "info");
		try {
			await Promise.all([loadOverview(), loadSettings()]);
			setMessage(appMessage, "\u770b\u677f\u5df2\u5237\u65b0\u3002", "success");
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	document.getElementById("comments-search-button").addEventListener("click", async () => {
		state.commentsPage = 1;
		state.commentsSearch = commentsSearchInput.value.trim();
		try {
			await loadComments();
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	document.getElementById("comments-refresh").addEventListener("click", async () => {
		try {
			await Promise.all([loadComments(), loadOverview()]);
			setMessage(appMessage, "\u8bc4\u8bba\u5217\u8868\u5df2\u5237\u65b0\u3002", "success");
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	commentsPrev.addEventListener("click", async () => {
		if (state.commentsPage <= 1) return;
		state.commentsPage -= 1;
		try {
			await loadComments();
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	commentsNext.addEventListener("click", async () => {
		if (state.commentsPage >= state.commentsTotalPages) return;
		state.commentsPage += 1;
		try {
			await loadComments();
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	document.getElementById("analytics-refresh").addEventListener("click", async () => {
		try {
			await loadAnalytics();
			setMessage(appMessage, "\u8bbf\u95ee\u7edf\u8ba1\u5df2\u5237\u65b0\u3002", "success");
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	document.getElementById("export-comments").addEventListener("click", async () => {
		try {
			await downloadExport("comments");
			setMessage(appMessage, "\u8bc4\u8bba\u6570\u636e\u5df2\u5f00\u59cb\u5bfc\u51fa\u3002", "success");
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	document.getElementById("export-analytics").addEventListener("click", async () => {
		try {
			await downloadExport("analytics");
			setMessage(appMessage, "\u8bbf\u95ee\u7edf\u8ba1\u6570\u636e\u5df2\u5f00\u59cb\u5bfc\u51fa\u3002", "success");
		} catch (error) {
			setMessage(appMessage, error.message, "error");
		}
	});

	window.addEventListener("DOMContentLoaded", () => {
		void restoreSession();
	});
})();
