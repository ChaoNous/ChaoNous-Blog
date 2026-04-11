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
	website: string;
	parentId: string;
}

export const COMMENT_MESSAGES = {
	loading: "\u8bc4\u8bba\u52a0\u8f7d\u4e2d\u2026",
	empty: "\u8fd8\u6ca1\u6709\u8bc4\u8bba\uff0c\u6b22\u8fce\u7559\u4e0b\u7b2c\u4e00\u6761\u3002",
	replyFallbackAuthor: "\u8fd9\u6761\u8bc4\u8bba",
	submitIdle: "\u63d0\u4ea4\u8bc4\u8bba",
	submitBusy: "\u63d0\u4ea4\u4e2d\u2026",
	submitHint: "\u8bc4\u8bba\u63d0\u4ea4\u540e\u4f1a\u76f4\u63a5\u53d1\u5e03\u5230\u9875\u9762\u3002",
	submitSuccess: "\u8bc4\u8bba\u5df2\u53d1\u5e03\u3002",
	submitError: "\u8bc4\u8bba\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
	loadError: "\u8bc4\u8bba\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
	deleteError: "\u8bc4\u8bba\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
	deleteSuccess: "\u8bc4\u8bba\u5df2\u5220\u9664\u3002",
	deleteConfirm:
		"\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u6761\u8bc4\u8bba\u5417\uff1f\u5220\u9664\u540e\u5c06\u65e0\u6cd5\u6062\u590d\u3002",
	replyPrefix: "\u6b63\u5728\u56de\u590d ",
	cancelReply: "\u53d6\u6d88",
	requiredPlaceholder: "\u5fc5\u586b",
	optionalPlaceholder: "\u9009\u586b",
	contentPlaceholder: "\u5199\u4e0b\u4f60\u7684\u60f3\u6cd5\u2026",
	anonymous: "\u533f\u540d",
	nameLabel: "\u6635\u79f0",
	emailLabel: "\u90ae\u7bb1",
	urlLabel: "\u7f51\u5740",
	contentLabel: "\u5185\u5bb9",
	deleteLabel: "\u5220\u9664",
	replyLabel: "\u56de\u590d",
	softDeletedAuthor: "\u5df2\u6ce8\u9500",
} as const;
