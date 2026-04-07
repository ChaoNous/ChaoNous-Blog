(function () {
	const notice = document.getElementById("admin-notice");
	const list = document.getElementById("comment-list");
	const passwordInput = document.getElementById("admin-password");
	const statusSelect = document.getElementById("comment-status");
	const loadButton = document.getElementById("load-comments");

	function escapeHtml(value) {
		return String(value).replace(/[&<>"]/g, (char) => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;"
		}[char]));
	}

	function setNotice(message, type) {
		notice.textContent = message;
		notice.className = type ? `notice ${type}` : "notice";
	}

	function getPassword() {
		return passwordInput.value.trim();
	}

	function renderComments(items) {
		if (!items.length) {
			list.innerHTML = '<div class="notice">\u5f53\u524d\u72b6\u6001\u4e0b\u6ca1\u6709\u8bc4\u8bba\u3002</div>';
			return;
		}

		list.innerHTML = items.map((item) => `
			<article class="comment-card">
				<div class="comment-meta">
					<strong>${escapeHtml(item.authorName)}</strong>
					<span>${escapeHtml(item.postTitle || item.postSlug)}</span>
					<span>${new Date(item.createdAt).toLocaleString("zh-CN")}</span>
					<span>\u72b6\u6001\uff1a${escapeHtml(item.status)}</span>
				</div>
				<div class="comment-content">${escapeHtml(item.content).replace(/\n/g, "<br />")}</div>
				<div class="comment-actions">
					<button data-id="${item.id}" data-status="approved">\u53d1\u5e03</button>
					<button class="secondary" data-id="${item.id}" data-status="rejected">\u62d2\u7edd</button>
					<button class="secondary" data-id="${item.id}" data-status="pending">\u8bbe\u4e3a\u5f85\u5ba1\u6838</button>
				</div>
			</article>
		`).join("");
	}

	async function loadComments() {
		const password = getPassword();
		if (!password) {
			setNotice("\u8bf7\u5148\u8f93\u5165\u540e\u53f0\u5bc6\u7801\u3002", "error");
			return;
		}

		setNotice("\u6b63\u5728\u8bfb\u53d6\u8bc4\u8bba\u2026");
		list.innerHTML = "";

		const response = await fetch(`/api/admin/comments?status=${encodeURIComponent(statusSelect.value)}`, {
			headers: {
				"x-comment-admin-password": password,
				Accept: "application/json"
			}
		});

		const payload = await response.json();
		if (!response.ok) {
			setNotice(payload.message || "\u8bc4\u8bba\u8bfb\u53d6\u5931\u8d25\u3002", "error");
			return;
		}

		setNotice(`\u5df2\u52a0\u8f7d ${payload.data.length} \u6761\u8bc4\u8bba\u3002`);
		renderComments(payload.data);
	}

	async function updateStatus(id, status) {
		const password = getPassword();
		if (!password) {
			setNotice("\u8bf7\u5148\u8f93\u5165\u540e\u53f0\u5bc6\u7801\u3002", "error");
			return;
		}

		const response = await fetch(`/api/admin/comments/${id}`, {
			method: "PATCH",
			headers: {
				"content-type": "application/json",
				"x-comment-admin-password": password,
				Accept: "application/json"
			},
			body: JSON.stringify({ status })
		});

		const payload = await response.json();
		if (!response.ok) {
			setNotice(payload.message || "\u8bc4\u8bba\u72b6\u6001\u66f4\u65b0\u5931\u8d25\u3002", "error");
			return;
		}

		setNotice(`\u8bc4\u8bba #${id} \u5df2\u66f4\u65b0\u4e3a ${status}\u3002`);
		await loadComments();
	}

	loadButton.addEventListener("click", () => {
		void loadComments();
	});

	window.addEventListener("DOMContentLoaded", () => {
		statusSelect.value = "approved";
	});

	list.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-id]");
		if (!button) return;
		void updateStatus(button.dataset.id, button.dataset.status);
	});
})();
