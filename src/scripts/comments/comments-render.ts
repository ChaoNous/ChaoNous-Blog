import {
	COMMENT_MESSAGES,
	type MountSiteCommentsOptions,
	type SiteComment,
	type SiteCommentsState,
} from "./comments-types";

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
	state: SiteCommentsState,
	depth = 0,
): string {
	const repliesHtml = comment.replies
		.map((reply) => renderCommentItem(reply, options, state, depth + 1))
		.join("");

	const isSoftDeleted = comment.authorName === "已注销";
	if (isSoftDeleted) {
		return repliesHtml
			? `
		<article class="site-comment-card is-deleted-shell${depth > 0 ? " is-reply" : ""}">
			<div class="site-comment-replies">${repliesHtml}</div>
		</article>`
			: "";
	}

	const authorLabel = escapeHtml(
		comment.authorName || COMMENT_MESSAGES.anonymous,
	);
	const authorHtml = comment.authorUrl
		? `<a href="${escapeHtml(comment.authorUrl)}" target="_blank" rel="nofollow noopener noreferrer" class="site-comment-author link-btn">${authorLabel}</a>`
		: `<span class="site-comment-author">${authorLabel}</span>`;

	const deleteButton = state.ownedComments[String(comment.id)]
		? `<button type="button" class="site-comment-delete-btn link-btn" data-delete-id="${comment.id}">
				删除
			</button>`
		: "";

	return `
		<article class="site-comment-card${depth > 0 ? " is-reply" : ""}">
			<header class="site-comment-header">
				<div class="site-comment-meta">
					${authorHtml}
					<time class="site-comment-time" datetime="${escapeHtml(comment.createdAt)}">${escapeHtml(formatDate(comment.createdAt, options.lang))}</time>
				</div>
				<div class="site-comment-actions-inline">
					${deleteButton}
					<button type="button" class="site-comment-reply-btn link-btn" data-reply-id="${comment.id}" data-reply-author="${authorLabel}">
						回复
					</button>
				</div>
			</header>
			<div class="site-comment-content">${formatCommentContent(comment.content)}</div>
			${repliesHtml ? `<div class="site-comment-replies">${repliesHtml}</div>` : ""}
		</article>
	`;
}

export function renderCommentsState(
	container: HTMLElement,
	state: SiteCommentsState,
	options: MountSiteCommentsOptions,
): void {
	const commentsHtml = state.loading
		? `<div class="site-comments-empty">${COMMENT_MESSAGES.loading}</div>`
		: state.comments.length > 0
			? state.comments
					.map((comment) => renderCommentItem(comment, options, state))
					.join("")
			: `<div class="site-comments-empty">${COMMENT_MESSAGES.empty}</div>`;

	const noticeHtml = state.error
		? `<div class="site-comments-notice is-error">${escapeHtml(state.error)}</div>`
		: state.success
			? `<div class="site-comments-notice is-success">${escapeHtml(state.success)}</div>`
			: "";

	const replyBanner = state.replyTarget
		? `
			<div class="site-comments-replying">
				<span>${COMMENT_MESSAGES.replyPrefix}${escapeHtml(state.replyTarget.authorName)}</span>
				<button type="button" class="link-btn" data-action="cancel-reply">${COMMENT_MESSAGES.cancelReply}</button>
			</div>
		`
		: "";

	container.innerHTML = `
		<section class="site-comments-shell">
			${noticeHtml}
			${replyBanner}
			<form class="site-comments-form">
				<div class="site-comments-grid">
					<label class="site-comments-field">
						<span>${COMMENT_MESSAGES.nameLabel}</span>
						<input name="name" type="text" maxlength="50" required placeholder="${COMMENT_MESSAGES.requiredPlaceholder}" value="${escapeHtml(state.visitorInfo.name)}" />
					</label>
					<label class="site-comments-field">
						<span>${COMMENT_MESSAGES.emailLabel}</span>
						<input name="email" type="email" maxlength="120" required placeholder="${COMMENT_MESSAGES.requiredPlaceholder}" value="${escapeHtml(state.visitorInfo.email)}" />
					</label>
				</div>
				<label class="site-comments-field">
					<span>${COMMENT_MESSAGES.urlLabel}</span>
					<input name="url" type="text" inputmode="url" maxlength="200" placeholder="${COMMENT_MESSAGES.optionalPlaceholder}" value="${escapeHtml(state.visitorInfo.url)}" />
				</label>
				<label class="site-comments-field">
					<span>${COMMENT_MESSAGES.contentLabel}</span>
					<textarea name="content" rows="5" maxlength="2000" required placeholder="${COMMENT_MESSAGES.contentPlaceholder}"></textarea>
				</label>
				<input name="parentId" type="hidden" value="${state.replyTarget?.id ?? ""}" />
				<div class="site-comments-actions">
					<button type="submit" class="site-comments-submit"${state.submitting ? " disabled" : ""}>
						${state.submitting ? COMMENT_MESSAGES.submitBusy : COMMENT_MESSAGES.submitIdle}
					</button>
					<span class="site-comments-hint">${COMMENT_MESSAGES.submitHint}</span>
				</div>
			</form>
			<div class="site-comments-list">${commentsHtml}</div>
		</section>
	`;
}

