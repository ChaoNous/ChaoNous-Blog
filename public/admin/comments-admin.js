(function () {
	const notice = document.getElementById("admin-notice");
	const list = document.getElementById("comment-list");
	const passwordInput = document.getElementById("admin-password");
	const statusSelect = document.getElementById("comment-status");
	const loadButton = document.getElementById("load-comments");

	function setNotice(message, type) {
		notice.textContent = message;
		notice.className = type ? `notice ${type}` : "notice";
	}

	function getPassword() {
		return passwordInput.value.trim();
	}

	function renderComments(items) {
		if (!items.length) {
			list.innerHTML = '<div class="notice">??????????</div>';
			return;
		}

		list.innerHTML = items.map((item) => `
			<article class="comment-card">
				<div class="comment-meta">
					<strong>${item.authorName}</strong>
					<span>${item.postTitle || item.postSlug}</span>
					<span>${new Date(item.createdAt).toLocaleString("zh-CN")}</span>
					<span>??:${item.status}</span>
				</div>
				<div class="comment-content">${String(item.content).replace(/[&<>"]/g, (char) => ({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;"
				}[char])).replace(/\n/g, "<br />")}</div>
				<div class="comment-actions">
					<button data-id="${item.id}" data-status="approved">??</button>
					<button class="secondary" data-id="${item.id}" data-status="rejected">??</button>
					<button class="secondary" data-id="${item.id}" data-status="pending">?????</button>
				</div>
			</article>
		`).join("");
	}

	async function loadComments() {
		const password = getPassword();
		if (!password) {
			setNotice("?????????", "error");
			return;
		}

		setNotice("??????.");
		list.innerHTML = "";

		const response = await fetch(`/api/admin/comments?status=${encodeURIComponent(statusSelect.value)}`, {
			headers: {
				"x-comment-admin-password": password,
				Accept: "application/json"
			}
		});

		const payload = await response.json();
		if (!response.ok) {
			setNotice(payload.message || "???????", "error");
			return;
		}

		setNotice(`??? ${payload.data.length} ????`);
		renderComments(payload.data);
	}

	async function updateStatus(id, status) {
		const password = getPassword();
		if (!password) {
			setNotice("?????????", "error");
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
			setNotice(payload.message || "?????????", "error");
			return;
		}

		setNotice(`?? #${id} ???? ${status}?`);
		await loadComments();
	}

	loadButton.addEventListener("click", () => {
		void loadComments();
	});

	list.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-id]");
		if (!button) return;
		void updateStatus(button.dataset.id, button.dataset.status);
	});
})();
