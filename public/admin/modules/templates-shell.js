import { renderAnalyticsView, renderCommentsView, renderDashboardView } from "./templates-views.js";

export function renderSidebar() {
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

export function renderShellHeader() {
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

export function renderAdminApp() {
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
