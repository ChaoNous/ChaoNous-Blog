export const storageKeys = {
	theme: "cnc-admin-theme",
};

export function createAdminState() {
	return {
		theme: "light",
		currentView: "dashboard",
		commentsPage: 1,
		commentsTotalPages: 0,
		commentsSearch: "",
		selectedCommentIds: new Set(),
	};
}
