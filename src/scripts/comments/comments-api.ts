import type {
	CommentMutationResponse,
	CommentSubmissionPayload,
	SiteCommentsResponse,
} from "./comments-types";

export function normalizeUrlInput(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "";
	if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed;
	return `https://${trimmed}`;
}

async function parseJsonResponse<T>(
	response: Response,
	fallbackMessage: string,
): Promise<T> {
	const payload = (await response.json().catch(() => null)) as
		| { message?: string }
		| null;

	if (!response.ok) {
		throw new Error(payload?.message || fallbackMessage);
	}

	return payload as T;
}

export async function fetchComments(
	apiBasePath: string,
	postSlug: string,
	fallbackMessage: string,
): Promise<SiteCommentsResponse> {
	const params = new URLSearchParams({
		postSlug,
		limit: "100",
	});

	const response = await fetch(`${apiBasePath}?${params.toString()}`, {
		headers: {
			Accept: "application/json",
		},
	});

	return parseJsonResponse<SiteCommentsResponse>(response, fallbackMessage);
}

export async function submitComment(
	apiBasePath: string,
	payload: CommentSubmissionPayload,
	fallbackMessage: string,
): Promise<CommentMutationResponse> {
	const response = await fetch(apiBasePath, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(payload),
	});

	return parseJsonResponse<CommentMutationResponse>(response, fallbackMessage);
}

export async function deleteCommentByToken(
	apiBasePath: string,
	id: number,
	token: string,
	fallbackMessage: string,
): Promise<CommentMutationResponse> {
	const response = await fetch(
		`${apiBasePath}/${id}?token=${encodeURIComponent(token)}`,
		{
			method: "DELETE",
			headers: {
				Accept: "application/json",
			},
		},
	);

	return parseJsonResponse<CommentMutationResponse>(response, fallbackMessage);
}

