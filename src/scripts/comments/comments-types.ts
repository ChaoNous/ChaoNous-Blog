export interface SiteComment {
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

export interface SiteCommentsResponse {
	data: SiteComment[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalCount: number;
	};
}

export interface CommentMutationResponse {
	ok: boolean;
	id?: number;
	deleteToken?: string;
	message?: string;
}

export interface MountSiteCommentsOptions {
	apiBasePath: string;
	postSlug: string;
	postUrl: string;
	postTitle: string;
	lang?: string;
}

export interface VisitorInfo {
	name: string;
	email: string;
	url: string;
}

export interface ReplyTarget {
	id: number;
	authorName: string;
}

export interface SiteCommentsState {
	comments: SiteComment[];
	error: string;
	success: string;
	loading: boolean;
	submitting: boolean;
	replyTarget: ReplyTarget | null;
	ownedComments: Record<string, string>;
	visitorInfo: VisitorInfo;
}

export interface CommentSubmissionPayload {
	postSlug: string;
	postUrl: string;
	postTitle: string;
	name: string;
	email: string;
	url: string;
	content: string;
	parentId: string;
}

export const COMMENT_MESSAGES = {
	loading: "评论加载中…",
	empty: "还没有评论，欢迎留下第一条。",
	replyFallbackAuthor: "这条评论",
	submitIdle: "提交评论",
	submitBusy: "提交中…",
	submitHint: "评论提交后会直接发布到页面。",
	submitSuccess: "评论已发布。",
	submitError: "评论提交失败，请稍后再试。",
	loadError: "评论加载失败，请稍后再试。",
	deleteError: "评论删除失败，请稍后再试。",
	deleteSuccess: "评论已删除。",
	deleteConfirm:
		"确定要删除这条评论吗？删除后你的个人信息和评论内容将被清除，但评论位置会保留以维持讨论结构。",
	replyPrefix: "正在回复 ",
	cancelReply: "取消",
	requiredPlaceholder: "必填",
	optionalPlaceholder: "选填",
	contentPlaceholder: "写下你的想法…",
	anonymous: "匿名",
	nameLabel: "昵称",
	emailLabel: "邮箱",
	urlLabel: "网址",
	contentLabel: "内容",
} as const;

