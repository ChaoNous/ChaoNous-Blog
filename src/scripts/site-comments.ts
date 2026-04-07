interface SiteComment {
	id: number;
	parentId: number | null;
	postSlug: string;
	postUrl: string;
	postTitle: string;
	authorName: string;
	authorUrl: string | null;
	content: string;
	createdAt: string;
	replies: SiteComment[];
}

interface SiteCommentsResponse {
	data: SiteComment[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalCount: number;
	};
}

interface MountSiteCommentsOptions {
	apiBasePath: string;
	postSlug: string;
	postUrl: string;
	postTitle: string;
	lang?: string;
}

interface SiteCommentsState {
	comments: SiteComment[];
	error: string;
	success: string;
	loading: boolean;
	submitting: boolean;
	replyTarget: { id: number; authorName: string } | null;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function formatDate(value: string, lang = "zh-CN"): string {
	try {
		return new Intl.DateTimeFormat(lang, {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(value));
	} catch {
		return value;
	}
}

function formatCommentContent(content: string): string {
	return escapeHtml(content).replaceAll("\n", "<br />");
}

function renderCommentItem(
	comment: SiteComment,
	options: MountSiteCommentsOptions,
	depth = 0,
): string {
	const authorLabel = escapeHtml(comment.authorName || "匿名");
	const author = comment.authorUrl
		? `<a href="${escapeHtml(comment.authorUrl)}" target="_blank" rel="nofollow noopener noreferrer" class="site-comment-author link-btn">${authorLabel}</a>`
		: `<span class="site-comment-author">${authorLabel}</span>`;
	const replies = comment.replies
		.map((reply) => renderCommentItem(reply, options, depth + 1))
		.join("");

	return `
		<article class="site-comment-card${depth > 0 ? " is-reply" : ""}">
			<header class="site-comment-header">
				<div class="site-comment-meta">
					${author}
					<time class="site-comment-time" datetime="${escapeHtml(comment.createdAt)}">${escapeHtml(formatDate(comment.createdAt, options.lang))}</time>
				</div>
				<button type="button" class="site-comment-reply-btn link-btn" data-reply-id="${comment.id}" data-reply-author="${authorLabel}">
					回复
				</button>
			</header>
			<div class="site-comment-content">${formatCommentContent(comment.content)}</div>
			${replies ? `<div class="site-comment-replies">${replies}</div>` : ""}
		</article>
	`;
}

function renderState(
	container: HTMLElement,
	state: SiteCommentsState,
	options: MountSiteCommentsOptions,
): void {
	const commentsHtml = state.loading
		? `<div class="site-comments-empty">评论加载中…</div>`
		: state.comments.length > 0
			? state.comments.map((comment) => renderCommentItem(comment, options)).join("")
			: `<div class="site-comments-empty">还没有评论，欢迎留下第一条。</div>`;

	const noticeHtml = state.error
		? `<div class="site-comments-notice is-error">${escapeHtml(state.error)}</div>`
		: state.success
			? `<div class="site-comments-notice is-success">${escapeHtml(state.success)}</div>`
			: "";

	const replyBanner = state.replyTarget
		? `
			<div class="site-comments-replying">
				<span>正在回复 ${escapeHtml(state.replyTarget.authorName)}</span>
				<button type="button" class="link-btn" data-action="cancel-reply">取消</button>
			</div>
		`
		: "";

	container.innerHTML = `
		<section class="site-comments-shell">
			<div class="site-comments-head">
				<h2 class="site-comments-title">评论</h2>
				<p class="site-comments-subtitle">评论系统已迁回站内，同域 API 直接提交并发布。</p>
			</div>
			${noticeHtml}
			${replyBanner}
			<form class="site-comments-form">
				<div class="site-comments-grid">
					<label class="site-comments-field">
						<span>昵称</span>
						<input name="name" type="text" maxlength="50" required placeholder="你的名字" />
					</label>
					<label class="site-comments-field">
						<span>邮箱</span>
						<input name="email" type="email" maxlength="120" required placeholder="name@example.com" />
					</label>
				</div>
				<label class="site-comments-field">
					<span>网址</span>
					<input name="url" type="url" maxlength="200" placeholder="https://example.com" />
				</label>
				<label class="site-comments-field">
					<span>内容</span>
					<textarea name="content" rows="5" maxlength="2000" required placeholder="写下你的想法…"></textarea>
				</label>
				<input name="parentId" type="hidden" value="${state.replyTarget?.id ?? ""}" />
				<div class="site-comments-actions">
					<button type="submit" class="site-comments-submit"${state.submitting ? " disabled" : ""}>
						${state.submitting ? "提交中…" : "提交评论"}
					</button>
					<span class="site-comments-hint">评论提交后会直接发布到页面。</span>
				</div>
			</form>
			<div class="site-comments-list">${commentsHtml}</div>
		</section>
	`;
}

export function mountSiteComments(
	container: HTMLElement,
	options: MountSiteCommentsOptions,
): () => void {
	const state: SiteCommentsState = {
		comments: [],
		error: "",
		success: "",
		loading: true,
		submitting: false,
		replyTarget: null,
	};

	let disposed = false;

	const setState = (patch: Partial<SiteCommentsState>) => {
		if (disposed) return;
		Object.assign(state, patch);
		renderState(container, state, options);
		bindEvents();
	};

	const loadComments = async () => {
		setState({ loading: true, error: "", success: "" });

		try {
			const params = new URLSearchParams({
				postSlug: options.postSlug,
				limit: "100",
			});
			const response = await fetch(`${options.apiBasePath}?${params.toString()}`, {
				headers: {
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("评论加载失败，请稍后再试。");
			}

			const payload = (await response.json()) as SiteCommentsResponse;
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
						: "评论加载失败，请稍后再试。",
			});
		}
	};

	const submitComment = async (form: HTMLFormElement) => {
		const formData = new FormData(form);
		const payload = {
			postSlug: options.postSlug,
			postUrl: options.postUrl,
			postTitle: options.postTitle,
			name: String(formData.get("name") || "").trim(),
			email: String(formData.get("email") || "").trim(),
			url: String(formData.get("url") || "").trim(),
			content: String(formData.get("content") || "").trim(),
			parentId: String(formData.get("parentId") || "").trim(),
		};

		setState({ submitting: true, error: "", success: "" });

		try {
			const response = await fetch(options.apiBasePath, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(payload),
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result?.message || "评论提交失败，请稍后再试。");
			}

			form.reset();
			setState({
				submitting: false,
				replyTarget: null,
				success: result?.message || "评论已发布。",
			});
			await loadComments();
		} catch (error) {
			setState({
				submitting: false,
				error:
					error instanceof Error
						? error.message
						: "评论提交失败，请稍后再试。",
			});
		}
	};

	const bindEvents = () => {
		const form = container.querySelector<HTMLFormElement>(".site-comments-form");
		if (form && !form.dataset.bound) {
			form.dataset.bound = "true";
			form.addEventListener("submit", (event) => {
				event.preventDefault();
				void submitComment(form);
			});
		}

		container
			.querySelectorAll<HTMLButtonElement>("[data-reply-id]")
			.forEach((button) => {
				if (button.dataset.bound === "true") return;
				button.dataset.bound = "true";
				button.addEventListener("click", () => {
					setState({
						replyTarget: {
							id: Number(button.dataset.replyId),
							authorName: button.dataset.replyAuthor || "这条评论",
						},
						error: "",
						success: "",
					});
					container
						.querySelector<HTMLTextAreaElement>('textarea[name="content"]')
						?.focus();
				});
			});

		container
			.querySelectorAll<HTMLButtonElement>('[data-action="cancel-reply"]')
			.forEach((button) => {
				if (button.dataset.bound === "true") return;
				button.dataset.bound = "true";
				button.addEventListener("click", () => {
					setState({
						replyTarget: null,
						error: "",
						success: "",
					});
				});
			});
	};

	renderState(container, state, options);
	bindEvents();
	void loadComments();

	return () => {
		disposed = true;
		container.innerHTML = "";
	};
}
