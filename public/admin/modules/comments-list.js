import { escapeHtml, formatDate, formatNumber } from "./utils.js";

export function createCommentsListController({
	state,
	dom,
	request,
	setMessage,
	refreshCommentsAndOverview,
}) {
	function resetSelection() {
		state.selectedCommentIds.clear();
		updateSelectionUi();
	}

	function updateSelectionUi() {
		const selectedCount = state.selectedCommentIds.size;
		dom.commentsSelectionCount.textContent =
			selectedCount > 0
				? `\u5df2\u9009 ${formatNumber(selectedCount)} \u6761`
				: "\u672a\u9009\u62e9\u8bc4\u8bba";
		dom.commentsBulkDelete.disabled = selectedCount === 0;

		const checkboxes = Array.from(
			dom.commentsList.querySelectorAll('[data-role="comment-select"]'),
		);
		const selectableCount = checkboxes.length;
		const checkedCount = checkboxes.filter((node) => node.checked).length;
		dom.commentsSelectPage.checked =
			selectableCount > 0 && checkedCount === selectableCount;
		dom.commentsSelectPage.indeterminate =
			checkedCount > 0 && checkedCount < selectableCount;
		dom.commentsSelectPage.disabled = selectableCount === 0;
	}

	function renderComments(items) {
		resetSelection();

		if (!items.length) {
			dom.commentsList.innerHTML =
				'<div class="message info">\u6ca1\u6709\u5339\u914d\u7684\u8bc4\u8bba\u3002</div>';
			return;
		}

		dom.commentsList.innerHTML = items
			.map((item) => {
				const authorMeta = [
					item.authorEmail ? escapeHtml(item.authorEmail) : "",
					item.authorUrl ? escapeHtml(item.authorUrl) : "",
				]
					.filter(Boolean)
					.join(" / ");

				return `
				<article class="comment-row" data-id="${item.id}">
					<div class="comment-row-header">
						<div class="comment-row-main">
							<label class="comment-check">
								<input data-role="comment-select" type="checkbox" value="${item.id}" />
								<span>\u9009\u4e2d</span>
							</label>
							<div>
								<strong>${escapeHtml(item.authorName)}</strong>
								<span class="table-meta">&nbsp;${escapeHtml(item.postTitle || item.postSlug)}</span>
							</div>
						</div>
						<div class="inline-actions">
							<span class="table-meta">${formatDate(item.createdAt)}</span>
							<button class="ghost-button danger-button" data-action="delete" data-id="${item.id}" type="button">\u5220\u9664</button>
						</div>
					</div>
					<div>${escapeHtml(item.content).replaceAll("\n", "<br />")}</div>
					<div class="table-meta" style="margin-top: 0.65rem;">${escapeHtml(item.postSlug)}</div>
					${
						authorMeta
							? `<div class="table-meta" style="margin-top: 0.4rem;">${authorMeta}</div>`
							: ""
					}
				</article>
				`;
			})
			.join("");

		updateSelectionUi();
	}

	async function loadComments() {
		const params = new URLSearchParams({
			page: String(state.commentsPage),
			limit: "12",
		});

		if (state.commentsSearch) {
			params.set("search", state.commentsSearch);
		}

		dom.commentsList.innerHTML =
			'<div class="message info">\u6b63\u5728\u52a0\u8f7d\u8bc4\u8bba\u2026</div>';
		const payload = await request(`/api/admin/comments?${params.toString()}`);
		state.commentsTotalPages = Number(payload.pagination.total || 0);

		if (
			state.commentsPage > 1 &&
			state.commentsTotalPages > 0 &&
			state.commentsPage > state.commentsTotalPages
		) {
			state.commentsPage = state.commentsTotalPages;
			return loadComments();
		}

		renderComments(payload.data || []);
		dom.commentsPaginationMeta.textContent =
			`\u7b2c ${payload.pagination.page} / ${Math.max(payload.pagination.total, 1)} \u9875\uff0c\u5171 ${formatNumber(payload.pagination.totalCount)} \u6761\u8bc4\u8bba`;
		dom.commentsPrev.disabled = state.commentsPage <= 1;
		dom.commentsNext.disabled =
			state.commentsTotalPages === 0 ||
			state.commentsPage >= state.commentsTotalPages;
	}

	async function deleteComment(id) {
		const confirmed = window.confirm(
			"\u786e\u8ba4\u5220\u9664\u8fd9\u6761\u8bc4\u8bba\uff1f\u5982\u679c\u6709\u56de\u590d\uff0c\u4f1a\u4e00\u5e76\u5220\u9664\u3002",
		);
		if (!confirmed) return;

		setMessage(dom.appMessage, "\u6b63\u5728\u5220\u9664\u8bc4\u8bba\u2026", "info");
		await request(`/api/admin/comments/${id}`, {
			method: "DELETE",
		});
		state.selectedCommentIds.delete(id);
		await refreshCommentsAndOverview("\u8bc4\u8bba\u5df2\u5220\u9664\u3002");
	}

	function bindEvents() {
		document
			.getElementById("comments-search-button")
			.addEventListener("click", async () => {
				state.commentsPage = 1;
				state.commentsSearch = dom.commentsSearchInput.value.trim();
				try {
					await loadComments();
				} catch (error) {
					setMessage(dom.appMessage, error.message, "error");
				}
			});

		document.getElementById("comments-refresh").addEventListener("click", async () => {
			try {
				await refreshCommentsAndOverview("\u8bc4\u8bba\u5217\u8868\u5df2\u5237\u65b0\u3002");
			} catch (error) {
				setMessage(dom.appMessage, error.message, "error");
			}
		});

		dom.commentsPrev.addEventListener("click", async () => {
			if (state.commentsPage <= 1) return;
			state.commentsPage -= 1;
			try {
				await loadComments();
			} catch (error) {
				setMessage(dom.appMessage, error.message, "error");
			}
		});

		dom.commentsNext.addEventListener("click", async () => {
			if (state.commentsPage >= state.commentsTotalPages) return;
			state.commentsPage += 1;
			try {
				await loadComments();
			} catch (error) {
				setMessage(dom.appMessage, error.message, "error");
			}
		});

		dom.commentsSelectPage.addEventListener("change", () => {
			const checked = dom.commentsSelectPage.checked;
			dom.commentsList
				.querySelectorAll('[data-role="comment-select"]')
				.forEach((node) => {
					node.checked = checked;
					const id = Number.parseInt(node.value, 10);
					if (!Number.isFinite(id) || id <= 0) return;
					if (checked) {
						state.selectedCommentIds.add(id);
					} else {
						state.selectedCommentIds.delete(id);
					}
				});
			updateSelectionUi();
		});

		dom.commentsList.addEventListener("change", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) return;
			if (target.dataset.role !== "comment-select") return;

			const id = Number.parseInt(target.value, 10);
			if (!Number.isFinite(id) || id <= 0) return;
			if (target.checked) {
				state.selectedCommentIds.add(id);
			} else {
				state.selectedCommentIds.delete(id);
			}
			updateSelectionUi();
		});

		dom.commentsList.addEventListener("click", async (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return;
			const button = target.closest("[data-action='delete']");
			if (!(button instanceof HTMLButtonElement)) return;

			const id = Number.parseInt(button.dataset.id || "", 10);
			if (!Number.isFinite(id) || id <= 0) return;

			try {
				button.disabled = true;
				await deleteComment(id);
			} catch (error) {
				setMessage(dom.appMessage, error.message, "error");
			} finally {
				button.disabled = false;
			}
		});
	}

	return {
		loadComments,
		bindEvents,
		resetSelection,
	};
}
