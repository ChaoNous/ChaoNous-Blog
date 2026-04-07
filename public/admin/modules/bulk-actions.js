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
			setMessage(
				dom.appMessage,
				"\u8bf7\u5148\u9009\u62e9\u8981\u5220\u9664\u7684\u8bc4\u8bba\u3002",
				"error",
			);
			return;
		}

		const confirmed = window.confirm(
			`\u786e\u8ba4\u6279\u91cf\u5220\u9664 ${ids.length} \u6761\u8bc4\u8bba\uff1f\u5982\u679c\u5305\u542b\u56de\u590d\uff0c\u4f1a\u4e00\u5e76\u5220\u9664\u3002`,
		);
		if (!confirmed) return;

		setMessage(
			dom.appMessage,
			"\u6b63\u5728\u6267\u884c\u6279\u91cf\u5220\u9664\u2026",
			"info",
		);
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
			payload.message || "\u6279\u91cf\u5220\u9664\u5df2\u5b8c\u6210\u3002",
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
