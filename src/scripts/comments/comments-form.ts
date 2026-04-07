interface BindCommentEventsOptions {
	container: HTMLElement;
	onSubmit: (form: HTMLFormElement) => void;
	onReply: (payload: { id: number; authorName: string }) => void;
	onCancelReply: () => void;
	onDelete: (id: number) => void;
}

export function bindCommentEvents({
	container,
	onSubmit,
	onReply,
	onCancelReply,
	onDelete,
}: BindCommentEventsOptions): void {
	const form = container.querySelector<HTMLFormElement>(".site-comments-form");
	if (form && !form.dataset.bound) {
		form.dataset.bound = "true";
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			onSubmit(form);
		});
	}

	container
		.querySelectorAll<HTMLButtonElement>("[data-reply-id]")
		.forEach((button) => {
			if (button.dataset.bound === "true") return;
			button.dataset.bound = "true";
			button.addEventListener("click", () => {
				onReply({
					id: Number(button.dataset.replyId),
					authorName: button.dataset.replyAuthor || "",
				});
			});
		});

	container
		.querySelectorAll<HTMLButtonElement>('[data-action="cancel-reply"]')
		.forEach((button) => {
			if (button.dataset.bound === "true") return;
			button.dataset.bound = "true";
			button.addEventListener("click", () => {
				onCancelReply();
			});
		});

	container
		.querySelectorAll<HTMLButtonElement>("[data-delete-id]")
		.forEach((button) => {
			if (button.dataset.bound === "true") return;
			button.dataset.bound = "true";
			button.addEventListener("click", () => {
				onDelete(Number(button.dataset.deleteId));
			});
		});
}

