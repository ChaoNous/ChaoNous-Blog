import type {
  DARK_MODE,
  LIGHT_MODE,
} from "../constants/constants";

export type SiteConfig = {
  title: string;
  subtitle: string;
  siteURL: string;
  keywords?: string[];
  siteStartDate?: string;

  timeZone:
    | -12
    | -11
    | -10
    | -9
    | -8
    | -7
    | -6
    | -5
    | -4
    | -3
    | -2
    | -1
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12;

  lang: "en" | "zh_CN";

  themeColor: {
    hue: number;
    fixed: boolean;
  };

  navbarTitle?: {
    mode?: "text-icon" | "logo";
    text: string;
    icon?: string;
    logo?: string;
  };

  font: {
    asciiFont: {
      fontFamily: string;
      fontWeight: string | number;
      localFonts: string[];
      enableCompress: boolean;
    };
    cjkFont: {
      fontFamily: string;
      fontWeight: string | number;
      localFonts: string[];
      enableCompress: boolean;
    };
  };

  tagStyle?: {
    useNewStyle?: boolean;
  };


  banner: {
    src:
      | string
      | string[]
      | {
          desktop?: string | string[];
          mobile?: string | string[];
        };
    position?: "top" | "center" | "bottom";
    carousel?: {
      enable: boolean;
      interval: number;
    };
    homeText?: {
      enable: boolean;
      title?: string;
      subtitle?: string | string[];
      typewriter?: {
        enable: boolean;
        speed: number;
        deleteSpeed: number;
        pauseTime: number;
      };
    };
    navbar?: {
      transparentMode?: "semi" | "full" | "semifull";
    };
  };
  toc: {
    depth: 1 | 2 | 3;
  };
  showCoverInContent: boolean;
  generateOgImages: boolean;
  favicon: Favicon[];
};

export type Favicon = {
  src: string;
  theme?: "light" | "dark";
  sizes?: string;
};

export enum LinkPreset {
  Home = 0,
  Archive = 1,
}

export type NavBarLink = {
  name: string;
  url: string;
  external?: boolean;
  icon?: string;
  children?: (NavBarLink | LinkPreset)[];
};

export type NavBarConfig = {
  links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
  avatar?: string;
  name: string;
  bio?: string;
  links: {
    name: string;
    url: string;
    icon: string;
  }[];
  typewriter?: {
    enable: boolean;
    speed?: number;
    deleteSpeed?: number;
    pauseTime?: number;
  };
};

export type LicenseConfig = {
  enable: boolean;
  name: string;
  url: string;
};

export type LIGHT_DARK_MODE = typeof LIGHT_MODE | typeof DARK_MODE;


export type BlogPostData = {
  body: string;
  title: string;
  published: Date;
  description: string;
  tags: string[];
  draft?: boolean;
  image?: string;
  category?: string;
  pinned?: boolean;
  prevTitle?: string;
  prevSlug?: string;
  nextTitle?: string;
  nextSlug?: string;
};

export type ExpressiveCodeConfig = {
  theme: string;
  hideDuringThemeTransition?: boolean;
};

export type MusicPlayerConfig = {
  enable: boolean;
  meting_api: string;
  id: string;
  server: string;
  type: string;
};

export type WidgetComponentType =
  | "profile"
  | "categories"
  | "card-toc"
  | "music-player"
  | "site-stats"
  | "calendar"
  | "custom";

export type WidgetComponentConfig = {
  type: WidgetComponentType;
  position: "top" | "sticky";
  class?: string;
  style?: string;
  animationDelay?: number;
  responsive?: {
    hidden?: ("mobile" | "tablet" | "desktop")[];
    collapseThreshold?: number;
  };
  customProps?: Record<string, any>;
};

export type SidebarLayoutConfig = {
  properties: WidgetComponentConfig[];
  components: {
    left: WidgetComponentType[];
    right?: WidgetComponentType[];
    drawer: WidgetComponentType[];
  };
  defaultAnimation: {
    enable: boolean;
    baseDelay: number;
    increment: number;
  };
  responsive: {
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
};
