// 友链数据配置
// 添加你的友链信息到这个数组中

export interface FriendLink {
	name: string;
	url: string;
	avatar: string;
	description: string;
	tags?: string[];
	// 站点截图/封面图（可选）
	screenshot?: string;
	// 站点状态（可选）: active=正常, inactive=停更, error=无法访问
	status?: "active" | "inactive" | "error";
	// 创建时间（可选，用于排序）
	createdAt?: string;
}

export const friendsData: FriendLink[] = [
	// 我的网站
	{
		name: "ChaoNous",
		url: "https://chaonous.com",
		avatar: "/assets/images/avatar.webp",
		description: "人是万物的尺度。",
		tags: ["生活", "随笔"],
		status: "active",
	},
	// 添加友链示例：
	// {
	//   name: "友站名称",
	//   url: "https://example.com",
	//   avatar: "https://example.com/avatar.png",
	//   description: "友站简介",
	//   tags: ["技术", "生活"],
	//   screenshot: "https://example.com/screenshot.png",
	//   status: "active",
	// },
];

// 获取所有标签
export function getAllTags(): string[] {
	const tags = new Set<string>();
	friendsData.forEach((friend) => {
		friend.tags?.forEach((tag) => tags.add(tag));
	});
	return Array.from(tags).sort();
}

// 获取友链数量
export function getFriendsCount(): number {
	return friendsData.length;
}
