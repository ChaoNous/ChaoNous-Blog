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
  showCoverInContent: true,
  generateOgImages: true,
  favicon: [],

  font: {
    asciiFont: {
      fontFamily: "'Cinzel'",
      fontWeight: "400",
      localFonts: [],
      enableCompress: false,
    },
    cjkFont: {
      fontFamily: "'Zhuque Fangsong UI'",
      fontWeight: "400",
      localFonts: ["ZhuqueFangsong-Regular.ttf"],
      enableCompress: true,
    },
  },
  showLastModified: false,
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

export const permalinkConfig: PermalinkConfig = {
  enable: false,
  format: "%postname%",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  theme: "github-dark",
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
  enable: false,
  customHtml: "",
};

export const commentConfig = {
  enable: true,
  envId: "https://twikoo-cloudflare.198665x.workers.dev",
  region: "",
  lang: "zh-CN",
};

export const sidebarLayoutConfig: SidebarLayoutConfig = {
  properties: [
    {
      type: "profile",
      position: "sticky",
      class: "onload-animation",
      animationDelay: 0,
    },
    {
      type: "categories",
      position: "sticky",
      class: "onload-animation",
      animationDelay: 250,
      responsive: {
        collapseThreshold: 5,
      },
    },
    {
      type: "card-toc",
      position: "sticky",
      class: "onload-animation",
      animationDelay: 300,
    },
    {
      type: "site-stats",
      position: "sticky",
      class: "onload-animation",
      animationDelay: 200,
    },
    {
      type: "calendar",
      position: "sticky",
      class: "onload-animation",
      animationDelay: 250,
    },
  ],

  components: {
    left: ["profile", "categories", "card-toc"],
    right: ["site-stats", "calendar"],
    drawer: ["profile", "categories"],
  },

  defaultAnimation: {
    enable: true,
    baseDelay: 0,
    increment: 50,
  },

  responsive: {
    breakpoints: {
      mobile: 768,
      tablet: 1280,
      desktop: 1280,
    },
  },
};

// 组件配置汇总
export const widgetConfigs = {
  profile: profileConfig,
  music: musicPlayerConfig,
  layout: sidebarLayoutConfig,
  fullscreenWallpaper: fullscreenWallpaperConfig,
  share: shareConfig,
} as const;
