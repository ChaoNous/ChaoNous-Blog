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

export function renderCommentFormMarkup(
	state: SiteCommentsState,
	replyTarget: { id: number; authorName: string } | null,
	submitting = false,
): string {
	const replyBanner = replyTarget
		? `
			<div class="site-comments-replying is-inline">
				<span>${COMMENT_MESSAGES.replyPrefix}${escapeHtml(replyTarget.authorName)}</span>
				<button type="button" class="link-btn" data-action="cancel-reply">${COMMENT_MESSAGES.cancelReply}</button>
			</div>
		`
		: "";

	return `
		${replyBanner}
		<form class="site-comments-form">
			<div class="site-comments-grid">
				<label class="site-comments-field">
					<span>${COMMENT_MESSAGES.nameLabel}</span>
					<input name="name" type="text" maxlength="50" required autocomplete="name" placeholder="${COMMENT_MESSAGES.requiredPlaceholder}" value="${escapeHtml(state.visitorInfo.name)}" />
				</label>
				<label class="site-comments-field">
					<span>${COMMENT_MESSAGES.emailLabel}</span>
					<input name="email" type="email" maxlength="120" required autocomplete="email" placeholder="${COMMENT_MESSAGES.requiredPlaceholder}" value="${escapeHtml(state.visitorInfo.email)}" />
				</label>
			</div>
			<label class="site-comments-field">
				<span>${COMMENT_MESSAGES.urlLabel}</span>
				<input name="url" type="text" inputmode="url" maxlength="200" autocomplete="url" placeholder="${COMMENT_MESSAGES.optionalPlaceholder}" value="${escapeHtml(state.visitorInfo.url)}" />
			</label>
			<div class="site-comments-honeypot" aria-hidden="true">
				<label class="site-comments-field" tabindex="-1">
					<span>Website</span>
					<input name="website" type="text" tabindex="-1" autocomplete="off" />
				</label>
			</div>
			<label class="site-comments-field">
				<span>${COMMENT_MESSAGES.contentLabel}</span>
				<textarea name="content" rows="${replyTarget ? 4 : 5}" maxlength="2000" required placeholder="${COMMENT_MESSAGES.contentPlaceholder}"></textarea>
			</label>
			<input name="parentId" type="hidden" value="${replyTarget?.id ?? ""}" />
			<div class="site-comments-actions">
				<button type="submit" class="site-comments-submit"${submitting ? " disabled" : ""}>
					${submitting ? COMMENT_MESSAGES.submitBusy : COMMENT_MESSAGES.submitIdle}
				</button>
				<span class="site-comments-hint">${COMMENT_MESSAGES.submitHint}</span>
			</div>
		</form>
	`;
}

function renderCommentItemMarkup(
	comment: SiteComment,
	options: MountSiteCommentsOptions,
	state: SiteCommentsState,
	depth = 0,
): string {
	const repliesHtml = comment.replies
		.map((reply) => renderCommentItemMarkup(reply, options, state, depth + 1))
		.join("");

	const isSoftDeleted =
		comment.authorName === COMMENT_MESSAGES.softDeletedAuthor;
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
				${COMMENT_MESSAGES.deleteLabel}
			</button>`
		: "";

	const inlineReplyForm =
		state.replyTarget?.id === comment.id
			? `<div class="site-comment-inline-reply">${renderCommentFormMarkup(state, state.replyTarget, state.submitting)}</div>`
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
						${COMMENT_MESSAGES.replyLabel}
					</button>
				</div>
			</header>
			<div class="site-comment-content">${formatCommentContent(comment.content)}</div>
			${inlineReplyForm}
			${repliesHtml ? `<div class="site-comment-replies">${repliesHtml}</div>` : ""}
		</article>
	`;
}

export function renderCommentsListMarkup(
	state: SiteCommentsState,
	options: MountSiteCommentsOptions,
): string {
	if (state.loading) {
		return `<div class="site-comments-empty">${COMMENT_MESSAGES.loading}</div>`;
	}

	if (!state.comments.length) {
		return `<div class="site-comments-empty">${COMMENT_MESSAGES.empty}</div>`;
	}

	return state.comments
		.map((comment) => renderCommentItemMarkup(comment, options, state))
		.join("");
}

export function renderCommentsNoticeMarkup(state: SiteCommentsState): string {
	if (state.error) {
		return `<div class="site-comments-notice is-error" role="alert">${escapeHtml(state.error)}</div>`;
	}

	if (state.success) {
		return `<div class="site-comments-notice is-success" role="status">${escapeHtml(state.success)}</div>`;
	}

	return "";
}
