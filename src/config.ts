import type {
  CommentConfig,
  ExpressiveCodeConfig,
  LicenseConfig,
  MusicPlayerConfig,
  NavBarConfig,
  ProfileConfig,
  SidebarLayoutConfig,
  SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

const SITE_LANG = "zh_CN";
const SITE_TIMEZONE = 8;

export const siteConfig: SiteConfig = {
  title: "ChaoNous",
  subtitle: "",
  siteURL: "https://chaonous.com/",
  siteStartDate: "2026-03-03",
  keywords: ["博客", "技术", "编程", "前端", "Astro"],
  timeZone: SITE_TIMEZONE,
  lang: SITE_LANG,

  themeColor: {
    hue: 10,
    fixed: false,
  },

  navbarTitle: {
    mode: "text-icon",
    text: "ChaoNous",
    icon: "",
    logo: "",
  },

  pageScaling: {
    enable: true,
    targetWidth: 2000,
  },

  tagStyle: {
    useNewStyle: false,
  },

  banner: {
    src: {
      desktop: [],
      mobile: [],
    },
    position: "center",
    carousel: {
      enable: false,
      interval: 4,
    },
    navbar: {
      transparentMode: "semi",
    },
  },

  toc: {
    enable: true,
    mode: "float",
    depth: 2,
  },

  showCoverInContent: true,
  generateOgImages: true,
  favicon: [],

  font: {
    asciiFont: {
      fontFamily: "'Crimson Pro'",
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
  avatar: "assets/images/avatar.webp",
  name: "ChaoNous",
  bio: "行路难！行路难！多歧路，今安在？长风破浪会有时，直挂云帆济沧海。",
  typewriter: {
    enable: true,
    speed: 80,
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

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  theme: "github-dark",
  hideDuringThemeTransition: true,
};

export const musicPlayerConfig: MusicPlayerConfig = {
  enable: true,
  mode: "meting",
  meting_api:
    "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&auth=:auth&r=:r",
  id: "13556055400",
  server: "netease",
  type: "playlist",
};

export const commentConfig: CommentConfig = {
  enable: true,
  envId: "", // 请填写你部署的 cwd API 地址 (Please fill in your deployed cwd API address)
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
  ],

  components: {
    left: ["profile", "site-stats", "categories", "card-toc"],
    drawer: ["profile", "site-stats", "categories"],
  },

  defaultAnimation: {
    enable: true,
    baseDelay: 0,
    increment: 50,
  },

  responsive: {
    breakpoints: {
      mobile: 1024,
      tablet: 1280,
      desktop: 1280,
    },
  },
};
