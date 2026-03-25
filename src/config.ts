import type {
	AnnouncementConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	FullscreenWallpaperConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	PermalinkConfig,
	ProfileConfig,
	SakuraConfig,
	ShareConfig,
	SidebarLayoutConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// ========== i18n 国际化配置 ==========

// 网站基础配置
const SITE_LANG = "zh_CN"; // 网站语言，支持 'en', 'zh_CN', 'ja' 等
const SITE_TIMEZONE = 8; // 网站时区，范围 -12 to 12，默认 UTC+8

export const siteConfig: SiteConfig = {
	title: "ChaoNous",
	subtitle: "", // 网站副标题，用于 SEO 和社交分享
	siteURL: "https://chaonous.com/", // 网站URL，请替换为你自己的URL
	siteStartDate: "2026-03-03", // 网站创建日期，用于计算运行时间
	keywords: ["博客", "技术", "编程", "前端", "Astro"], // SEO 关键词

	timeZone: SITE_TIMEZONE,
	lang: SITE_LANG,

	themeColor: {
		hue: 72, // 主题色调，实际 hue 范围 0-360（UI 显示 0-100）。建议：红色 0，橙色 30，黄色 60，绿色 120，青色 180，蓝色 220，紫色 280
		fixed: false, // 是否固定色调，不允许用户调整
	},

	// 功能页面配置（关闭后导航栏不显示对应入口）
	featurePages: {
		projects: true, // 项目页面
		skills: true, // 技能页面
		timeline: true, // 时间线页面
		albums: true, // 相册页面
		devices: true, // 设备页面
	},

	// 导航栏标题配置
	navbarTitle: {
		mode: "text-icon", // 显示模式："text-icon" 显示文字+图标，"logo" 显示Logo
		text: "ChaoNous", // 导航栏文字
		icon: "", // 导航栏图标路径，如 public/assets/home/home.webp
		logo: "", // Logo 图片路径
	},

	// 页面缩放配置
	pageScaling: {
		enable: true, // 是否启用页面缩放
		targetWidth: 2000, // 目标宽度，用于计算缩放比例
	},

	// 标签样式配置
	tagStyle: {
		useNewStyle: false, // 是否使用新版标签样式
	},

	// 壁纸模式配置
	wallpaperMode: {
		defaultMode: "banner", // 默认模式："banner" 横幅模式，"fullscreen" 全屏壁纸，"none" 无壁纸
		// 移动端显示模式切换按钮
		// "off" = 不显示
		// "mobile" = 仅移动端显示
		// "desktop" = 仅桌面端显示
		// "both" = 两端都显示
		showModeSwitchOnMobile: "both",
	},

	banner: {
		// 横幅图片配置，数量大于 1 时自动启用轮播
		src: {
			desktop: [
				"/assets/desktop-banner/banner1.webp",
				"/assets/desktop-banner/banner2.webp",
				"/assets/desktop-banner/banner3.webp",
			],
			mobile: [
				"/assets/mobile-banner/banner1.webp",
				"/assets/mobile-banner/banner2.webp",
				"/assets/mobile-banner/banner3.webp",
			],
		},

		position: "top", // 图片位置，对应 object-position，可选 'top', 'center', 'bottom'，默认 'top'

		carousel: {
			enable: true, // 是否启用轮播，数量大于 1 时生效；false 则随机显示一张
			interval: 4, // 轮播间隔，单位：秒
		},

		waves: {
			enable: true, // 是否显示波浪动画
			performanceMode: false, // 性能模式，减少动画帧率（性能提升约30%）
			mobileDisable: false, // 移动端是否禁用
		},

		// PicFlow API 随机图片配置
		imageApi: {
			enable: false, // 是否启用随机图片API
			url: "http://domain.com/api_v2.php?format=text&count=4", // API地址，返回每行一个图片URL
		},
		// 使用 PicFlow API 时，src 配置将被覆盖
		// 项目地址: https://github.com/matsuzaka-yuki/PicFlow-API
		// 也可使用其他随机图片API

		homeText: {
			enable: true, // 是否在首页显示文字覆盖层
			title: "闲话漫谈",

			subtitle: [
				"学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？",
				"即使在他人看来是多么愚蠢和荒谬，然而只有遵循自己的选择，才能找到无怨无悔的人生。",
				"日月若驰，老将至矣，而功业不建，是以悲耳。",
				"天地之间有许多事情，是你们的哲学里所没有梦想到的。",
			],
			typewriter: {
				enable: true, // 是否启用打字机效果

				speed: 100, // 打字速度，单位：毫秒
				deleteSpeed: 50, // 删除速度，单位：毫秒
				pauseTime: 2000, // 打完字后停顿时间，单位：毫秒
			},
		},

		credit: {
			enable: false, // 是否显示图片版权信息

			text: "Describe", // 版权描述文字
			url: "", // 点击后跳转的 URL
		},

		navbar: {
			transparentMode: "semifull", // 导航栏透明模式："semi" 毛玻璃，"full" 完全透明，"semifull" 混合模式
		},
	},
	toc: {
		enable: true, // 是否启用目录
		mode: "float", // 目录显示模式："float" 悬浮，"sidebar" 侧边栏
		depth: 2, // 目录深度，1-6。例如 h1 则提取 h1，为 2 时从 h1 到 h2，以此类推
		useJapaneseBadge: false, // 使用日文徽章（未启用显示 "Table of Contents"..）
	},
	showCoverInContent: true, // 是否在文章内容中显示封面图
	generateOgImages: true, // 是否生成 OpenGraph 图片
	favicon: [
		// 配置 favicon
		// {
		//   src: '/favicon/icon.png',    // 图片路径
		//   theme: 'light',              // 适配主题，可选 'light' | 'dark'
		//   sizes: '32x32',              // 图片尺寸
		// }
	],

	// 字体配置
	font: {
		// 注意：若要自定义字体，请在 src/styles/main.css 中引入
		// 若使用本地字体（TTF格式），请放在 src/assets/fonts/ 目录下
		// 开发时请将字体放在 public/assets/fonts/，构建时会自动复制
		asciiFont: {
			// ASCII 字体 - 用于英文字符
			fontFamily: "'Cinzel'",
			fontWeight: "400",
			localFonts: [], // 本地字体文件
			enableCompress: false,
		},
		cjkFont: {
			// CJK 字体 - 用于中日韩文字
			fontFamily: "'Zhuque Fangsong UI'",
			fontWeight: "400",
			localFonts: ["ZhuqueFangsong-Regular.ttf"], // 本地字体文件（相对于 public/assets/font/）
			enableCompress: true,
		},
	},
	showLastModified: false, // 是否显示"最后修改时间"
};

export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	src: {
		desktop: [
			"/assets/desktop-banner/banner1.webp",
			"/assets/desktop-banner/banner2.webp",
			"/assets/desktop-banner/banner3.webp",
		],
		mobile: [
			"/assets/mobile-banner/banner1.webp",
			"/assets/mobile-banner/banner2.webp",
			"/assets/mobile-banner/banner3.webp",
		],
	},
	position: "center", // 壁纸位置，对应 object-position
	carousel: {
		enable: true, // 是否启用轮播
		interval: 5, // 轮播间隔，单位：秒
	},
	zIndex: -1, // 层级，默认置于底层
	opacity: 0.8, // 透明度
	blur: 1, // 模糊度，单位：像素
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "相册",
			url: "/albums/",
			icon: "material-symbols:photo-library",
		},
		LinkPreset.Friends,
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.webp", // 头像路径，不以 '/' 开头表示 src 目录
	name: "ChaoNous",
	bio: "行路难！行路难！多歧路，今安在？长风破浪会有时，直挂云帆济沧海。",
	typewriter: {
		enable: true, // 是否启用打字机效果
		speed: 80, // 打字速度
	},
	links: [
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/432268688",
		},
		{
			name: "知乎",
			icon: "simple-icons:zhihu",
			url: "https://www.zhihu.com/people/80-57-6-25",
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/ChaoNous",
		},
		{
			name: "Steam",
			icon: "simple-icons:steam",
			url: "https://steamcommunity.com/id/ChaoNous/",
		},
		{
			name: "Discord",
			icon: "fa7-brands:discord",
			url: "https://discord.com/users/1248814878656041003",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

// Permalink 自定义链接配置
export const permalinkConfig: PermalinkConfig = {
	enable: false, // 是否启用 permalink 自定义文章链接
	/**
	 * permalink 格式模板
	 * 可用变量：
	 * - %year% : 4位年份 (2024)
	 * - %monthnum% : 2位月份 (01-12)
	 * - %day% : 2位日期 (01-31)
	 * - %hour% : 2位小时 (00-23)
	 * - %minute% : 2位分钟 (00-59)
	 * - %second% : 2位秒钟 (00-59)
	 * - %post_id% : 文章自增ID（需要在同级目录下）
	 * - %postname% : 文章slug
	 * - %category% : 文章分类，默认 "uncategorized"
	 *
	 * 示例：
	 * - "%year%-%monthnum%-%postname%" => "/2024-12-my-post/"
	 * - "%post_id%-%postname%" => "/42-my-post/"
	 * - "%category%-%postname%" => "/tech-my-post/"
	 *
	 * 注意：格式以 "/" 开头和结尾，否则自动添加
	 */
	format: "%postname%", // 默认格式
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 代码块主题配置（如需自定义主题，请在 astro.config.mjs 中配置）
	// 若使用暗色主题，建议使用 github-dark；若使用亮色主题，建议使用 github-light
	theme: "github-dark",
	// 主题切换时隐藏代码块，避免闪烁
	hideDuringThemeTransition: true,
};

export const shareConfig: ShareConfig = {
	enable: true, // 是否启用分享功能
};

export const announcementConfig: AnnouncementConfig = {
	title: "",
	content: "",
	closable: false,
	link: {
		enable: true,
		text: "Learn More",
		url: "/about/",
		external: false,
	},
};

export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true, // 是否启用音乐播放器
	mode: "meting", // 播放器模式："local" 本地，"meting" 在线
	meting_api:
		"https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&auth=:auth&r=:r", // Meting API 地址
	id: "13556055400", // 歌单ID
	server: "netease", // 音乐平台：netease=网易云音乐，tencent=QQ音乐，kugou=酷狗音乐
	type: "playlist", // 资源类型
};

export const footerConfig: FooterConfig = {
	enable: false, // 是否启用 Footer HTML
	customHtml: "", // HTML 字符串，支持多行
};

/**
 * 侧边栏布局配置
 * 可配置多个侧边栏组件，支持响应式布局
 * sidebar: 默认显示位置，left 或 right，左右都显示时配置 layout.position 为 "both"
 */

// 评论配置 - Twikoo
export const commentConfig = {
	enable: true,
	envId: "https://twikoo-cloudflare.198665x.workers.dev", // Twikoo 环境 ID，从 Twikoo 控制台获取
	region: "", // 环境地域，默认为空，可选 "ap-shanghai" 等
	lang: "zh-CN", // 语言
};

export const sidebarLayoutConfig: SidebarLayoutConfig = {
	// 侧边栏组件配置
	properties: [
		{
			// 个人资料组件
			type: "profile",
			position: "sticky", // 显示位置："top" 置顶，"sticky" 粘性定位
			class: "onload-animation", // CSS 动画类
			animationDelay: 0, // 动画延迟
		},
		{
			// 分类组件
			type: "categories",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 250,
			responsive: {
				collapseThreshold: 5,
			},
		},
		{
			// 目录组件
			type: "card-toc",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 300,
		},
		{
			// 网站统计组件
			type: "site-stats",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 200,
		},
		{
			// 日历组件
			type: "calendar",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 250,
		},
	],

	// 左右侧边栏组件配置
	components: {
		left: ["profile", "categories", "card-toc"],
		right: ["site-stats", "calendar"],
		drawer: ["profile", "categories"],
	},

	// 默认动画配置
	defaultAnimation: {
		enable: true, // 是否启用默认动画
		baseDelay: 0, // 基础延迟
		increment: 50, // 每个组件延迟增量
	},

	// 响应式配置
	responsive: {
		breakpoints: {
			mobile: 768, // 移动端断点
			tablet: 1280, // 平板端断点
			desktop: 1280, // 桌面端断点
		},
	},
};

export const sakuraConfig: SakuraConfig = {
	enable: false, // 是否启用樱花飘落效果
	sakuraNum: 21, // 樱花数量
	limitTimes: -1, // 限制次数，-1 表示无限
	size: {
		min: 0.5, // 最小尺寸
		max: 1.1, // 最大尺寸
	},
	opacity: {
		min: 0.3, // 最小透明度
		max: 0.9, // 最大透明度
	},
	speed: {
		horizontal: {
			min: -1.7, // 水平最小速度
			max: -1.2, // 水平最大速度
		},
		vertical: {
			min: 1.5, // 垂直最小速度
			max: 2.2, // 垂直最大速度
		},
		rotation: 0.03, // 旋转速度
		fadeSpeed: 0.03, // 淡出速度，配合垂直最小速度调整
	},
	zIndex: 100, // 层级，建议设置为较高值避免被其他元素遮挡
};

// 组件配置汇总
export const widgetConfigs = {
	profile: profileConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	share: shareConfig,
} as const;
