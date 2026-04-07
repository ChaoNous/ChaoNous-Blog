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
			setMessage(dom.appMessage, "???????????", "error");
			return;
		}

		const confirmed = window.confirm(
			`?????? ${ids.length} ?????????????????`,
		);
		if (!confirmed) return;

		setMessage(dom.appMessage, "?????????", "info");
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
			payload.message || "????????",
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
