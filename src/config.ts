import type {
  ExpressiveCodeConfig,
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
  keywords: [
    "\u535A\u5BA2",
    "\u6280\u672F",
    "\u7F16\u7A0B",
    "\u524D\u7AEF",
    "Astro",
  ],
  timeZone: SITE_TIMEZONE,
  lang: SITE_LANG,

  themeColor: {
    hue: 0,
    fixed: false,
  },

  navbarTitle: {
    mode: "text-icon",
    text: "ChaoNous",
    icon: "",
    logo: "",
  },

  toc: {
    depth: 2,
  },

  showCoverInContent: true,
  generateOgImages: true,
  favicon: [],
};

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    {
      name: "\u76F8\u518C",
      url: "/albums/",
      icon: "material-symbols:photo-library",
    },
  ],
};

export const profileConfig: ProfileConfig = {
  avatar: "assets/images/avatar.webp",
  name: "ChaoNous",
  bio: "\u884C\u8DEF\u96BE\uFF01\u884C\u8DEF\u96BE\uFF01\u591A\u6B67\u8DEF\uFF0C\u4ECA\u5B89\u5728\uFF1F\n\u957F\u98CE\u7834\u6D6A\u4F1A\u6709\u65F6\uFF0C\u76F4\u6302\u4E91\u5E06\u6D4E\u6CA7\u6D77\u3002",
  links: [
    {
      name: "Bilibili",
      icon: "fa7-brands:bilibili",
      url: "https://space.bilibili.com/432268688",
    },
    {
      name: "\u77E5\u4E4E",
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

export const expressiveCodeConfig: ExpressiveCodeConfig = {
  hideDuringThemeTransition: true,
};

export const musicPlayerConfig: MusicPlayerConfig = {
  enable: true,
  meting_api:
    "/api/music/playlist?server=:server&type=:type&id=:id&auth=:auth&r=:r",
  id: "13556055400",
  server: "netease",
  type: "playlist",
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
