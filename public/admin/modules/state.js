export const storageKeys = {
	theme: "cnc-admin-theme",
};

export const pageMeta = {
	dashboard: {
		title: "数据看板",
		subtitle: "以直接发布模式查看当前全部评论和近期趋势。",
	},
	comments: {
		title: "评论管理",
		subtitle: "所有评论都已直接发布，可以单条删除或批量处理。",
	},
	analytics: {
		title: "访问统计",
		subtitle: "查看站点 PV / Visits 和热门页面排行。",
	},
	settings: {
		title: "站点设置",
		subtitle: "将当前直接发布策略、线程主键和会话鉴权方式集中展示。",
	},
	data: {
		title: "数据管理",
		subtitle: "导出评论和访问统计数据，用于备份或迁移。",
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

