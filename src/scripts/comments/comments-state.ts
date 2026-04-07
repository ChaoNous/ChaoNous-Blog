import type { SiteCommentsState, VisitorInfo } from "./comments-types";

const VISITOR_INFO_STORAGE_KEY = "cnc_visitor_info";
const OWNED_COMMENTS_STORAGE_KEY = "cnc_visitor_comments";

function readStorage<T>(key: string, fallback: T): T {
	try {
		const rawValue = localStorage.getItem(key);
		if (!rawValue) {
			return fallback;
		}

		return JSON.parse(rawValue) as T;
	} catch {
		return fallback;
	}
}

export function createInitialCommentsState(): SiteCommentsState {
	return {
		comments: [],
		error: "",
		success: "",
		loading: true,
		submitting: false,
		replyTarget: null,
		ownedComments: readStorage<Record<string, string>>(
			OWNED_COMMENTS_STORAGE_KEY,
			{},
		),
		visitorInfo: readStorage<VisitorInfo>(VISITOR_INFO_STORAGE_KEY, {
			name: "",
			email: "",
			url: "",
		}),
	};
}

export function persistVisitorInfo(visitorInfo: VisitorInfo): void {
	localStorage.setItem(VISITOR_INFO_STORAGE_KEY, JSON.stringify(visitorInfo));
}

export function persistOwnedComments(
	ownedComments: Record<string, string>,
): void {
	localStorage.setItem(
		OWNED_COMMENTS_STORAGE_KEY,
		JSON.stringify(ownedComments),
	);
}

