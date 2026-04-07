import {
	deleteCommentByToken,
	fetchComments,
	normalizeUrlInput,
	submitComment,
} from "./comments/comments-api";
import { bindCommentEvents } from "./comments/comments-form";
import { renderCommentsState } from "./comments/comments-render";
import {
	createInitialCommentsState,
	persistOwnedComments,
	persistVisitorInfo,
} from "./comments/comments-state";
import {
	COMMENT_MESSAGES,
	type MountSiteCommentsOptions,
	type SiteCommentsState,
} from "./comments/comments-types";

export function mountSiteComments(
	container: HTMLElement,
	options: MountSiteCommentsOptions,
): () => void {
	const state: SiteCommentsState = createInitialCommentsState();
	let disposed = false;

	const render = () => {
		if (disposed) return;
		renderCommentsState(container, state, options);
		bindCommentEvents({
			container,
			onSubmit: (form) => {
				void submitCurrentComment(form);
			},
			onReply: ({ id, authorName }) => {
				setState({
					replyTarget: {
						id,
						authorName: authorName || COMMENT_MESSAGES.replyFallbackAuthor,
					},
					error: "",
					success: "",
				});
				container
					.querySelector<HTMLTextAreaElement>(
						`.site-comment-inline-reply textarea[name="content"]`,
					)
					?.focus();
			},
			onCancelReply: () => {
				setState({
					replyTarget: null,
					error: "",
					success: "",
				});
			},
			onDelete: (id) => {
				void deleteCurrentComment(id);
			},
		});
	};

	const setState = (patch: Partial<SiteCommentsState>) => {
		if (disposed) return;
		Object.assign(state, patch);
		render();
	};

	const loadComments = async () => {
		setState({ loading: true, error: "", success: "" });

		try {
			const payload = await fetchComments(
				options.apiBasePath,
				options.postSlug,
				COMMENT_MESSAGES.loadError,
			);

			setState({
				comments: payload.data || [],
				loading: false,
			});
		} catch (error) {
			setState({
				comments: [],
				loading: false,
				error:
					error instanceof Error
						? error.message
						: COMMENT_MESSAGES.loadError,
			});
		}
	};

	const submitCurrentComment = async (form: HTMLFormElement) => {
		const formData = new FormData(form);
		const payload = {
			postSlug: options.postSlug,
			postUrl: options.postUrl,
			postTitle: options.postTitle,
			name: String(formData.get("name") || "").trim(),
			email: String(formData.get("email") || "").trim(),
			url: normalizeUrlInput(String(formData.get("url") || "")),
			content: String(formData.get("content") || "").trim(),
			parentId: String(formData.get("parentId") || "").trim(),
		};

		setState({ submitting: true, error: "", success: "" });

		try {
			const result = await submitComment(
				options.apiBasePath,
				payload,
				COMMENT_MESSAGES.submitError,
			);

			const visitorInfo = {
				name: payload.name,
				email: payload.email,
				url: payload.url || "",
			};
			persistVisitorInfo(visitorInfo);
			form.reset();

			const nextState: Partial<SiteCommentsState> = {
				visitorInfo,
				submitting: false,
				replyTarget: null,
				success: result.message || COMMENT_MESSAGES.submitSuccess,
			};

			if (result.deleteToken && result.id) {
				const ownedComments = {
					...state.ownedComments,
					[String(result.id)]: result.deleteToken,
				};
				persistOwnedComments(ownedComments);
				nextState.ownedComments = ownedComments;
			}

			setState(nextState);
			await loadComments();
		} catch (error) {
			setState({
				submitting: false,
				error:
					error instanceof Error
						? error.message
						: COMMENT_MESSAGES.submitError,
			});
		}
	};

	const deleteCurrentComment = async (id: number) => {
		const token = state.ownedComments[String(id)];
		if (!token) return;
		if (!window.confirm(COMMENT_MESSAGES.deleteConfirm)) {
			return;
		}

		setState({ loading: true, error: "", success: "" });

		try {
			const result = await deleteCommentByToken(
				options.apiBasePath,
				id,
				token,
				COMMENT_MESSAGES.deleteError,
			);

			const ownedComments = { ...state.ownedComments };
			delete ownedComments[String(id)];
			persistOwnedComments(ownedComments);

			setState({
				ownedComments,
				success: result.message || COMMENT_MESSAGES.deleteSuccess,
			});
			await loadComments();
		} catch (error) {
			console.error("deleteComment error:", error);
			setState({
				loading: false,
				error:
					error instanceof Error
						? error.message
						: COMMENT_MESSAGES.deleteError,
			});
		}
	};

	render();
	void loadComments();

	return () => {
		disposed = true;
		container.innerHTML = "";
	};
}
