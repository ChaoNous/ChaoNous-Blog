export interface Book {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

export type BookCategory = Record<string, Book[]>;

// 封面来源：微信读书
// 链接：微信读书
// 分类：参照主流读书平台分类方式

export const booksData: BookCategory = {
	文学小说: [
		{
			name: "活着",
			image: "https://cdn.weread.qq.com/weread/cover/1/yuewen_834464/t6_yuewen_8344641758521403.jpg",
			specs: "余华 · 长篇小说",
			description: "关于命运、苦难与生命韧性的中文小说经典。",
			link: "https://weread.qq.com/web/bookDetail/33332bf05cbba0333b1efb4",
		},
		{
			name: "飘",
			image: "https://cdn.weread.qq.com/weread/cover/52/YueWen_31515568/t6_YueWen_31515568.jpg",
			specs: "玛格丽特·米切尔 · 经典文学",
			description: "美国南北战争背景下，斯嘉丽的成长与命运沉浮。",
			link: "https://weread.qq.com/web/bookDetail/5a7328e071e0e3b05a7fd9b",
		},
		{
			name: "围城",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/457/22946457/t6_22946457.jpg",
			specs: "钱钟书 · 讽刺小说",
			description: "婚姻与人生的围城，城外的人想进去，城里的人想出来。",
			link: "https://weread.qq.com/web/bookDetail/54c32520715e229954c8b8a",
		},
		{
			name: "呐喊",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/700/785700/t6_785700.jpg",
			specs: "鲁迅 · 短篇小说集",
			description: "中国现代文学的开山之作，揭示国民性的深刻寓言。",
			link: "https://weread.qq.com/web/bookDetail/f1e32d705bfd24f1ef2ca13",
		},
		{
			name: "卡拉马佐夫兄弟",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/550/41077550/t6_41077550.jpg",
			specs: "陀思妥耶夫斯基 · 长篇小说",
			description: "一桩弑父案，展开对信仰、道德与人性的终极追问。",
			link: "https://weread.qq.com/web/bookDetail/4a0328f07272cb2e4a0e1b2",
		},
		{
			name: "月亮与六便士",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/133/22664133/t6_22664133.jpg",
			specs: "毛姆 · 长篇小说",
			description: "一个证券经纪人抛弃一切追寻艺术理想的故事。",
			link: "https://weread.qq.com/web/bookDetail/67232c607159d3c5672bfad",
		},
		{
			name: "刀锋",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/127/36680127/t6_36680127.jpg",
			specs: "毛姆 · 长篇小说",
			description: "一次大战后，一个美国青年对生命意义的追寻。",
			link: "https://weread.qq.com/web/bookDetail/f18327a0722fb1bff183b17",
		},
		{
			name: "悉达多",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/519/40133519/t6_40133519.jpg",
			specs: "赫尔曼·黑塞 · 哲理小说",
			description: "古印度贵族青年的求道之旅，关于自我与觉醒的诗意叙事。",
			link: "https://weread.qq.com/web/bookDetail/5db32f407264638f5db94b5",
		},
		{
			name: "局外人",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/800/22401800/t6_22401800.jpg",
			specs: "阿尔贝·加缪 · 存在主义",
			description: "荒诞主义的代表作，一个对世界漠然的人的命运。",
			link: "https://weread.qq.com/web/bookDetail/d62324607155d308d62547d",
		},
	],
	政治寓言: [
		{
			name: "1984",
			image: "https://cdn.weread.qq.com/weread/cover/83/YueWen_758867/t6_YueWen_758867.jpg",
			specs: "乔治·奥威尔 · 反乌托邦",
			description: "极权主义的预言式小说，思想控制与自由意志的经典之作。",
			link: "https://weread.qq.com/web/bookDetail/4be320905b94534becfd24b",
		},
		{
			name: "动物农场",
			image: "https://cdn.weread.qq.com/weread/cover/38/YueWen_811769/t6_YueWen_811769.jpg",
			specs: "乔治·奥威尔 · 政治寓言",
			description: "用动物革命的故事，揭示权力腐化与极权本质。",
			link: "https://weread.qq.com/web/bookDetail/b74324c05c62f9b743e3e8a",
		},
	],
	科幻: [
		{
			name: "三体全集 : 地球往事三部曲",
			image: "https://cdn.weread.qq.com/weread/cover/80/yuewen_695233/t6_yuewen_6952331740758482.jpg",
			specs: "刘慈欣 · 科幻小说",
			description:
				"中国科幻的巅峰之作，讲述人类文明与三体文明的宏大对决。",
			link: "https://weread.qq.com/web/bookDetail/ce032b305a9bc1ce0b0dd2a",
		},
		{
			name: "献给阿尔吉侬的花束",
			image: "https://cdn.weread.qq.com/weread/cover/11/yuewen_857863/t6_yuewen_8578631681827306.jpg",
			specs: "丹尼尔·凯斯 · 科幻小说",
			description:
				"智力提升实验下，一个人从弱智到天才再到失落的心路历程。",
			link: "https://weread.qq.com/web/bookDetail/03b326005d170703ba15f85",
		},
	],
	推理悬疑: [
		{
			name: "福尔摩斯探案全集（上中下）",
			image: "https://cdn.weread.qq.com/weread/cover/52/YueWen_26408000/t6_YueWen_26408000.jpg",
			specs: "柯南·道尔 · 推理小说",
			description: "史上最著名的侦探形象，推理小说的巅峰之作。",
			link: "https://weread.qq.com/web/bookDetail/abc326b07192f440abcfa9e",
		},
	],
	历史传记: [
		{
			name: "三国演义（全二册）",
			image: "https://cdn.weread.qq.com/weread/cover/20/yuewen_29855984/t6_yuewen_298559841676969263.jpg",
			specs: "罗贯中 · 古典名著",
			description: "三国纷争，英雄辈出，中国古典四大名著之一。",
			link: "https://weread.qq.com/web/bookDetail/73c32c5071c790f073c460a",
		},
		{
			name: "邓小平时代",
			image: "https://wfqqreader-1252317822.image.myqcloud.com/cover/48/674048/t6_674048.jpg",
			specs: "傅高义 · 传记",
			description: "哈佛学者对中国改革开放总设计师的权威传记。",
			link: "https://weread.qq.com/web/bookDetail/00f325d05a490000f72bda9",
		},
		{
			name: "万历十五年",
			image: "https://cdn.weread.qq.com/weread/cover/44/cpPlatform_wFh3Z1Xnp72HsAox1y9nUb/t6_cpPlatform_wFh3Z1Xnp72HsAox1y9nUb.jpg",
			specs: "黄仁宇 · 历史著作",
			description: "以1587年为切入点，透视明代中国的政治与社会结构。",
			link: "https://weread.qq.com/web/bookDetail/af732390813ab74f3g019ddd",
		},
	],
};
