import type {
	MountSiteCommentsOptions,
	SiteCommentsState,
} from "./comments-types";
import {
	renderCommentFormMarkup,
	renderCommentsListMarkup,
	renderCommentsNoticeMarkup,
} from "./comments-markup";

export function renderCommentsState(
	container: HTMLElement,
	state: SiteCommentsState,
	options: MountSiteCommentsOptions,
): void {
	container.innerHTML = `
		<section class="site-comments-shell">
			${renderCommentsNoticeMarkup(state)}
			${state.replyTarget ? "" : renderCommentFormMarkup(state, null, state.submitting)}
			<div class="site-comments-list">${renderCommentsListMarkup(state, options)}</div>
		</section>
	`;
}
