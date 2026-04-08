function renderLoginScreen() {
	return `
		<section id="login-screen" class="login-screen">
			<div class="login-card">
				<span class="login-badge">CNC Admin</span>
				<div>
					<h1 class="login-title">Comment Control</h1>
					<p class="login-subtitle">&#x7ad9;&#x5185;&#x81ea;&#x6258;&#x7ba1;&#x8bc4;&#x8bba;&#x7cfb;&#x7edf;&#x7ba1;&#x7406;&#x540e;&#x53f0;</p>
				</div>
				<form id="login-form" class="form-grid">
					<label class="form-field">
						<span class="form-label">&#x540e;&#x53f0;&#x5bc6;&#x7801;</span>
						<input id="login-password" class="form-input" type="password" autocomplete="current-password" />
					</label>
					<div id="login-message" class="message info">&#x8f93;&#x5165;&#x5bc6;&#x7801;&#x540e;&#x767b;&#x5f55;&#xff0c;&#x540e;&#x53f0;&#x4f1a;&#x521b;&#x5efa; HttpOnly &#x4f1a;&#x8bdd;&#xff0c;&#x65e0;&#x9700;&#x518d;&#x5728;&#x524d;&#x7aef;&#x4fdd;&#x5b58;&#x5bc6;&#x7801;&#x3002;</div>
					<div class="form-actions">
						<button id="login-submit" class="button" type="submit">&#x767b;&#x5f55;</button>
					</div>
				</form>
			</div>
		</section>
	`;
}

function renderSidebar() {
	return `
		<aside class="sidebar">
			<div class="panel" style="padding: 1rem;">
				<span class="page-badge">CNC</span>
				<h2 class="sidebar-title">ChaoNous Admin</h2>
				<p class="text-soft">&#x540e;&#x53f0;&#x5df2;&#x5207;&#x6362;&#x4e3a;&#x4f1a;&#x8bdd;&#x767b;&#x5f55; + &#x76f4;&#x63a5;&#x53d1;&#x5e03;&#x7684;&#x8bc4;&#x8bba;&#x7ba1;&#x7406;&#x6a21;&#x5f0f;&#x3002;</p>
			</div>
			<nav class="sidebar-nav">
				<button class="nav-button active" data-view="dashboard" type="button">
					<strong>&#x6570;&#x636e;&#x770b;&#x677f;</strong>
					<span>&#x6982;&#x89c8;&#x8bc4;&#x8bba;&#x603b;&#x91cf;&#x3001;&#x8d8b;&#x52bf;&#x4e0e;&#x70ed;&#x95e8;&#x6587;&#x7ae0;</span>
				</button>
				<button class="nav-button" data-view="comments" type="button">
					<strong>&#x8bc4;&#x8bba;&#x7ba1;&#x7406;</strong>
					<span>&#x641c;&#x7d22;&#x3001;&#x9009;&#x62e9;&#x3001;&#x5220;&#x9664;&#x5168;&#x90e8;&#x5df2;&#x53d1;&#x5e03;&#x8bc4;&#x8bba;</span>
				</button>
				<button class="nav-button" data-view="analytics" type="button">
					<strong>&#x7edf;&#x8ba1;&#x4e0e;&#x5bfc;&#x51fa;</strong>
					<span>&#x67e5;&#x770b; PV / Visits&#x3001;&#x70ed;&#x95e8;&#x9875;&#x9762;&#x5e76;&#x5bfc;&#x51fa;&#x6570;&#x636e;</span>
				</button>
			</nav>
		</aside>
	`;
}

function renderShellHeader() {
	return `
		<header class="shell-header panel">
			<div>
				<span class="page-badge">&#x540e;&#x53f0;&#x5df2;&#x767b;&#x5f55;</span>
				<h1 id="page-title">&#x6570;&#x636e;&#x770b;&#x677f;</h1>
				<p id="page-subtitle" class="page-subtitle">&#x67e5;&#x770b;&#x8bc4;&#x8bba;&#x3001;&#x7ad9;&#x70b9;&#x7edf;&#x8ba1;&#x548c;&#x5bfc;&#x51fa;&#x6570;&#x636e;&#x3002;</p>
			</div>
			<div class="header-actions">
				<button id="theme-toggle" class="ghost-button" type="button">&#x5207;&#x6362;&#x5916;&#x89c2;</button>
				<button id="logout-button" class="ghost-button" type="button">&#x9000;&#x51fa;</button>
			</div>
		</header>
	`;
}

function renderDashboardView() {
	return `
		<section id="view-dashboard" class="page-section active">
			<div class="metrics-grid">
				<div class="metric-card">
					<div class="metric-label">&#x8bc4;&#x8bba;&#x603b;&#x6570;</div>
					<div id="metric-comments-total" class="metric-value">0</div>
				</div>
				<div class="metric-card">
					<div class="metric-label">&#x7ad9;&#x70b9; PV</div>
					<div id="metric-pageviews" class="metric-value">0</div>
				</div>
				<div class="metric-card">
					<div class="metric-label">&#x7ad9;&#x70b9; Visits</div>
					<div id="metric-visits" class="metric-value">0</div>
				</div>
			</div>

			<div class="chart-grid">
				<section class="chart-card large">
					<div class="card-actions" style="justify-content: space-between;">
						<div>
							<h3 class="card-title">&#x8bc4;&#x8bba;&#x8fd1; 14 &#x5929;&#x8d8b;&#x52bf;</h3>
							<p class="card-desc">&#x5c55;&#x793a;&#x6700;&#x8fd1; 14 &#x5929;&#x7684;&#x8bc4;&#x8bba;&#x589e;&#x957f;&#x60c5;&#x51b5;&#x3002;</p>
						</div>
						<button id="dashboard-refresh" class="ghost-button" type="button">&#x5237;&#x65b0;</button>
					</div>
					<div id="dashboard-trend" class="bar-chart"></div>
				</section>
				<section class="table-card small">
					<h3 class="card-title">&#x6700;&#x8fd1;&#x8bc4;&#x8bba;</h3>
					<div id="dashboard-recent-comments" class="comment-list"></div>
				</section>
				<section class="table-card large">
					<h3 class="card-title">&#x70ed;&#x95e8;&#x6587;&#x7ae0;</h3>
					<div id="dashboard-hot-posts" class="info-list"></div>
				</section>
				<section class="info-card small">
					<h3 class="card-title">&#x7cfb;&#x7edf;&#x6982;&#x51b5;</h3>
					<div class="kv-list">
						<div class="kv-row"><div class="kv-key">&#x8bc4;&#x8bba;&#x552f;&#x4e00;&#x952e;</div><div>canonicalUrl</div></div>
						<div class="kv-row"><div class="kv-key">&#x5b58;&#x50a8;</div><div>Cloudflare D1</div></div>
						<div class="kv-row"><div class="kv-key">&#x8fd0;&#x884c;</div><div>Pages Functions</div></div>
					</div>
				</section>
			</div>
		</section>
	`;
}

function renderCommentsView() {
	return `
		<section id="view-comments" class="page-section">
			<section class="panel" style="padding: 1rem;">
				<div class="toolbar">
					<div class="toolbar-group">
						<input id="comments-search" class="form-input" type="search" placeholder="&#x641c;&#x7d22;&#x4f5c;&#x8005;&#x3001;&#x5185;&#x5bb9;&#x3001;&#x6587;&#x7ae0;" />
					</div>
					<div class="toolbar-group">
						<label class="selection-meta">
							<input id="comments-select-page" type="checkbox" />
							<span id="comments-selection-count">&#x672a;&#x9009;&#x62e9;&#x8bc4;&#x8bba;</span>
						</label>
						<button id="comments-bulk-delete" class="ghost-button danger-button" type="button" disabled>&#x6279;&#x91cf;&#x5220;&#x9664;</button>
						<button id="comments-search-button" class="ghost-button" type="button">&#x67e5;&#x8be2;</button>
						<button id="comments-refresh" class="ghost-button" type="button">&#x5237;&#x65b0;</button>
					</div>
				</div>
			</section>
			<section class="table-card">
				<div id="comments-list" class="comment-list"></div>
				<div class="pagination">
					<div id="comments-pagination-meta" class="footer-note">&#x5c1a;&#x672a;&#x52a0;&#x8f7d;&#x8bc4;&#x8bba;</div>
					<div class="inline-actions">
						<button id="comments-prev" class="ghost-button" type="button">&#x4e0a;&#x4e00;&#x9875;</button>
						<button id="comments-next" class="ghost-button" type="button">&#x4e0b;&#x4e00;&#x9875;</button>
					</div>
				</div>
			</section>
		</section>
	`;
}

function renderAnalyticsView() {
	return `
		<section id="view-analytics" class="page-section">
			<div class="metrics-grid">
				<div class="metric-card">
					<div class="metric-label">&#x7ad9;&#x70b9;&#x603b; PV</div>
					<div id="analytics-total-pv" class="metric-value">0</div>
				</div>
				<div class="metric-card">
					<div class="metric-label">&#x7ad9;&#x70b9;&#x603b; Visits</div>
					<div id="analytics-total-visits" class="metric-value">0</div>
				</div>
				<div class="metric-card">
					<div class="metric-label">&#x6536;&#x5f55;&#x9875;&#x9762;</div>
					<div id="analytics-page-count" class="metric-value">0</div>
				</div>
			</div>
			<div class="chart-grid">
				<section class="chart-card large">
					<div class="card-actions" style="justify-content: space-between;">
						<div>
							<h3 class="card-title">&#x8fd1;&#x671f;&#x8bbf;&#x95ee;&#x8d8b;&#x52bf;</h3>
							<p class="card-desc">&#x5c55;&#x793a;&#x9875;&#x9762;&#x8bbf;&#x95ee;&#x8d8b;&#x52bf;&#x548c;&#x7ad9;&#x5185;&#x7edf;&#x8ba1;&#x6570;&#x636e;&#x3002;</p>
						</div>
						<div class="inline-actions">
							<button id="export-comments" class="ghost-button" type="button">&#x5bfc;&#x51fa;&#x8bc4;&#x8bba;</button>
							<button id="export-analytics" class="ghost-button" type="button">&#x5bfc;&#x51fa;&#x7edf;&#x8ba1;</button>
							<button id="analytics-refresh" class="ghost-button" type="button">&#x5237;&#x65b0;</button>
						</div>
					</div>
					<div id="analytics-trend" class="bar-chart"></div>
				</section>
				<section class="table-card small">
					<h3 class="card-title">&#x70ed;&#x95e8;&#x9875;&#x9762;</h3>
					<div id="analytics-pages" class="info-list"></div>
				</section>
			</div>
		</section>
	`;
}

function renderAdminApp() {
	return `
		<div id="admin-app" class="admin-shell hidden">
			${renderSidebar()}
			<main class="shell-main">
				${renderShellHeader()}
				<div id="app-message" class="message info">&#x540e;&#x53f0;&#x5c31;&#x7eea;&#x3002;</div>
				${renderDashboardView()}
				${renderCommentsView()}
				${renderAnalyticsView()}
			</main>
		</div>
	`;
}

export function renderAdminShell() {
	return `${renderLoginScreen()}${renderAdminApp()}`;
}
