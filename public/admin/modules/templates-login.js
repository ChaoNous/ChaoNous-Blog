export function renderLoginScreen() {
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
