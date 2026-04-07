export function createBulkActionsController({
	state,
	dom,
	request,
	setMessage,
	resetSelection,
	refreshCommentsAndOverview,
}) {
	async function bulkDeleteComments() {
		const ids = Array.from(state.selectedCommentIds);
		if (!ids.length) {
			setMessage(dom.appMessage, "请先选择要删除的评论。", "error");
			return;
		}

		const confirmed = window.confirm(
			`确认批量删除 ${ids.length} 条评论？如果包含回复，会一并删除。`,
		);
		if (!confirmed) return;

		setMessage(dom.appMessage, "正在执行批量删除…", "info");
		const payload = await request("/api/admin/comments/bulk", {
			method: "POST",
			headers: {
				"content-type": "application/json; charset=utf-8",
			},
			body: JSON.stringify({
				action: "delete",
				ids,
			}),
		});

		resetSelection();
		await refreshCommentsAndOverview(
			payload.message || "批量删除已完成。",
		);
	}

	function bindEvents() {
		dom.commentsBulkDelete.addEventListener("click", async () => {
			try {
				await bulkDeleteComments();
			} catch (error) {
				setMessage(dom.appMessage, error.message, "error");
			}
		});
	}

	return {
		bindEvents,
	};
}

