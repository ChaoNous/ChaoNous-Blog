export const storageKeys = {
	theme: "cnc-admin-theme",
};

export const pageMeta = {
	dashboard: {
		title: "\u6570\u636e\u770b\u677f",
		subtitle:
			"\u6982\u89c8\u8bc4\u8bba\u603b\u91cf\u3001\u8fd1\u671f\u8d8b\u52bf\u548c\u70ed\u95e8\u6587\u7ae0\u3002",
	},
	comments: {
		title: "\u8bc4\u8bba\u7ba1\u7406",
		subtitle:
			"\u641c\u7d22\u3001\u7b5b\u9009\u5e76\u5220\u9664\u5df2\u53d1\u5e03\u8bc4\u8bba\u3002",
	},
	analytics: {
		title: "\u7edf\u8ba1\u4e0e\u5bfc\u51fa",
		subtitle:
			"\u67e5\u770b\u7ad9\u70b9 PV / Visits\u3001\u70ed\u95e8\u9875\u9762\uff0c\u5e76\u5bfc\u51fa\u6570\u636e\u3002",
	},
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
