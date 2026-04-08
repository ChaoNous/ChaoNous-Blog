export function renderDashboardView() {
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

export function renderCommentsView() {
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

export function renderAnalyticsView() {
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
