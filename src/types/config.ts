import type {
	DARK_MODE,
	LIGHT_MODE,
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
} from "../constants/constants";

export type SiteConfig = {
	title: string;
	subtitle: string;
	siteURL: string; // 缁旀瑧鍋RL閿涘奔浜掗弬婊勬浆缂佹挸鐔敍灞肩伐婵″偊绱癶ttps://chaonous.com/
	keywords?: string[]; // 缁旀瑧鍋ｉ崗鎶芥暛鐠囧稄绱濋悽銊ょ艾閻㈢喐鍨?<meta name="keywords">
	siteStartDate?: string; // 缁旀瑧鍋ｅ鈧慨瀣）閺堢噦绱濋弽鐓庣础閿涙瓛YYY-MM-DD閿涘瞼鏁ゆ禍搴ゎ吀缁犳绻嶇悰灞姐亯閺?

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

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	themeColor: {
		hue: number;
		fixed: boolean;
	};

	// 閻楃澹婃い鐢告桨瀵偓閸忔娊鍘ょ純?
	featurePages: {
		projects: boolean; // 妞ゅ湱娲版い鐢告桨瀵偓閸?
		skills: boolean; // 閹垛偓閼充粙銆夐棃銏犵磻閸?
		timeline: boolean; // 閺冨爼妫跨痪鍧椼€夐棃銏犵磻閸?
		albums: boolean; // 閻╃鍞芥い鐢告桨瀵偓閸?
		devices: boolean; // 鐠佹儳顦い鐢告桨瀵偓閸?
	};

	// 妞よ埖鐖弽鍥暯闁板秶鐤?
	navbarTitle?: {
		mode?: "text-icon" | "logo"; // 閺勫墽銇氬Ο鈥崇础閿?text-icon" 閺勫墽銇氶崶鐐垼+閺傚洦婀伴敍?logo" 娴犲懏妯夌粈绡杘go
		text: string; // 妞よ埖鐖弽鍥暯閺傚洦婀?
		icon?: string; // 妞よ埖鐖弽鍥暯閸ョ偓鐖ｇ捄顖氱窞
		logo?: string; // 缂冩垹鐝疞ogo閸ュ墽澧栫捄顖氱窞
	};

	// 妞ょ敻娼伴懛顏勫З缂傗晜鏂侀柊宥囩枂
	pageScaling?: {
		enable: boolean; // 閺勵垰鎯佸鈧崥顖濆殰閸斻劎缂夐弨?
		targetWidth?: number; // 閻╊喗鐖ｇ€硅棄瀹抽敍灞肩秵娴滃孩顒濈€硅棄瀹抽弮璺虹磻婵缂夐弨?
	};

	// 濞ｈ濮炵€涙ぞ缍嬮柊宥囩枂
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

	// 閺嶅洨顒烽弽宄扮础闁板秶鐤?
	tagStyle?: {
		useNewStyle?: boolean; // 閺勵垰鎯佹担璺ㄦ暏閺傜増鐗卞蹇ョ礄閹剙浠犳妯瑰瘨閺嶅嘲绱￠敍澶庣箷閺勵垱妫弽宄扮础閿涘牆顦诲鍡楃埗娴滎喗鐗卞蹇ョ礆
	};

	// 婢逛胶鐒婂Ο鈥崇础闁板秶鐤?
	wallpaperMode: {
		defaultMode: "banner" | "fullscreen"; // 姒涙顓绘竟浣虹剨濡€崇础閿涙瓬anner=妞ゅ爼鍎村Ο顏勭畽閿涘畺ullscreen=閸忋劌鐫嗘竟浣虹剨閿涘one=閺冪姴顥嗙痪?
		showModeSwitchOnMobile?: "off" | "mobile" | "desktop" | "both"; // 閺佺繝缍嬬敮鍐ㄧ湰閺傝顢嶉崚鍥ㄥ床閹稿鎸抽弰鍓с仛鐠佸墽鐤嗛敍姝癴f=闂呮劘妫岄敍瀹畂bile=娴犲懐些閸斻劎顏敍瀹抏sktop=娴犲懏顢戦棃銏㈩伂閿涘異oth=閸忋劑鍎撮弰鍓с仛
	};

	banner: {
		src:
			| string
			| string[]
			| {
					desktop?: string | string[];
					mobile?: string | string[];
			  }; // 閺€顖涘瘮閸楁洑閲滈崶鍓у閵嗕礁娴橀悧鍥ㄦ殶缂佸嫭鍨ㄩ崚鍡楀焼鐠佸墽鐤嗗宀勬桨缁旑垰鎷扮粔璇插З缁旑垰娴橀悧?
		position?: "top" | "center" | "bottom";
		carousel?: {
			enable: boolean; // 閺勵垰鎯侀崥顖滄暏鏉烆喗鎸?
			interval: number; // 鏉烆喗鎸遍梻鎾閺冨爼妫块敍鍫㈩潡閿?
		};
		waves?: {
			enable: boolean; // 閺勵垰鎯侀崥顖滄暏濮樺瓨灏濈痪瑙勬櫏閺?
			performanceMode?: boolean; // 閹嗗厴濡€崇础閿涙艾鍣虹亸鎴濆З閻㈣顦查弶鍌氬
			mobileDisable?: boolean; // 缁夎濮╃粩顖滎洣閻?
		};
		imageApi?: {
			enable: boolean; // 閺勵垰鎯侀崥顖滄暏閸ュ墽澧朅PI
			url: string; // API閸︽澘娼冮敍宀冪箲閸ョ偞鐦＄悰灞肩娑擃亜娴橀悧鍥懠閹恒儳娈戦弬鍥ㄦ拱
		};
		homeText?: {
			enable: boolean; // 閺勵垰鎯侀崷銊╊浕妞ゅ灚妯夌粈楦垮殰鐎规矮绠熼弬鍥х摟
			title?: string; // 娑撶粯鐖ｆ０?
			subtitle?: string | string[]; // 閸擃垱鐖ｆ０姗堢礉閺€顖涘瘮閸楁洑閲滅€涙顑佹稉鍙夊灗鐎涙顑佹稉鍙夋殶缂?
			typewriter?: {
				enable: boolean; // 閺勵垰鎯侀崥顖滄暏閹垫挸鐡ч張鐑樻櫏閺?
				speed: number; // 閹垫挸鐡ч柅鐔峰閿涘牊顕犵粔鎺炵礆
				deleteSpeed: number; // 閸掔娀娅庨柅鐔峰閿涘牊顕犵粔鎺炵礆
				pauseTime: number; // 鐎瑰本鏆ｉ弰鍓с仛閸氬海娈戦弳鍌氫粻閺冨爼妫块敍鍫燁嚑缁夋帪绱?
			};
		};
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
		navbar?: {
			transparentMode?: "semi" | "full" | "semifull"; // 鐎佃壈鍩呴弽蹇涒偓蹇旀濡€崇础
		};
	};
	toc: {
		enable: boolean;
		mode: "float" | "sidebar"; // 閻╊喖缍嶉弰鍓с仛濡€崇础閿?float" 閹剚璇為幐澶愭尦濡€崇础閿?sidebar" 娓氀嗙珶閺嶅繑膩瀵?
		depth: 1 | 2 | 3;
		useJapaneseBadge?: boolean; // 娴ｈ法鏁ら弮銉嚔閸嬪洤鎮曢弽鍥唶閿涘牄浜楅妵鍕╀簽閵囧牄浜?..閿涘鍞弴鎸庢殶鐎?
	};
	showCoverInContent: boolean; // 閹貉冨煑閺傚洨鐝风亸渚€娼伴崷銊︽瀮缁旂姴鍞寸€瑰綊銆夐弰鍓с仛閻ㄥ嫬绱戦崗?
	generateOgImages: boolean;
	favicon: Favicon[];
	showLastModified: boolean; // 閹貉冨煑閳ユ粈绗傚▎锛勭椽鏉堟垟鈧繂宕遍悧鍥ㄦ▔缁€铏规畱瀵偓閸?
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
	About = 2,
	Friends = 3,
	Diary = 4,
	Albums = 5,
	Projects = 6,
	Skills = 7,
	Timeline = 8,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
	icon?: string; // 閼挎粌宕熸い鐟版禈閺?
	children?: (NavBarLink | LinkPreset)[]; // 閺€顖涘瘮鐎涙劘褰嶉崡鏇礉閸欘垯浜掗弰鐤vBarLink閹存湙inkPreset
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
		enable: boolean; // 閺勵垰鎯侀崥顖滄暏閹垫挸鐡ч張鐑樻櫏閺?
		speed?: number; // 閹垫挸鐡ч柅鐔峰閿涘牊顕犵粔鎺炵礆
	};
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

// Permalink 闁板秶鐤?
export type PermalinkConfig = {
	enable: boolean; // 閺勵垰鎯侀崥顖滄暏閸忋劌鐪?permalink 閸旂喕鍏?
	/**
	 * permalink 閺嶇厧绱″Ο鈩冩緲
	 * 閺€顖涘瘮閻ㄥ嫬宕版担宥囶儊閿?
	 * - %year% : 4娴ｅ秴鍕炬禒?(2024)
	 * - %monthnum% : 2娴ｅ秵婀€娴?(01-12)
	 * - %day% : 2娴ｅ秵妫╅張?(01-31)
	 * - %hour% : 2娴ｅ秴鐨弮?(00-23)
	 * - %minute% : 2娴ｅ秴鍨庨柦?(00-59)
	 * - %second% : 2娴ｅ秶顫楅弫?(00-59)
	 * - %post_id% : 閺傚洨鐝锋惔蹇撳娇閿涘牊瀵滈崣鎴濈閺冨爼妫块崡鍥х碍閹烘帒鍨敍?
	 * - %postname% : 閺傚洨鐝烽弬鍥︽閸氬稄绱檚lug閿?
	 * - %category% : 閸掑棛琚崥宥忕礄閺冪姴鍨庣猾缁樻娑?"uncategorized"閿?
	 *
	 * 缁€杞扮伐閿?
	 * - "%year%-%monthnum%-%postname%" => "2024-12-my-post"
	 * - "%post_id%-%postname%" => "42-my-post"
	 * - "%category%-%postname%" => "tech-my-post"
	 *
	 * 濞夈劍鍓伴敍姘瑝閺€顖涘瘮閺傛粍娼?"/"閿涘本澧嶉張澶屾晸閹存劗娈戦柧鐐复闁棄婀弽鍦窗瑜版洑绗?
	 */
	format: string;
};

// 鐠囧嫯顔戦柊宥囩枂

export type LIGHT_DARK_MODE = typeof LIGHT_MODE | typeof DARK_MODE;

export type WALLPAPER_MODE =
	| typeof WALLPAPER_BANNER
	| typeof WALLPAPER_FULLSCREEN;

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
	hideDuringThemeTransition?: boolean; // 閺勵垰鎯侀崷銊ゅ瘜妫版ê鍨忛幑銏℃闂呮劘妫屾禒锝囩垳閸?
};

export type AnnouncementConfig = {
	// enable鐏炵偞鈧冨嚒缁夊娅庨敍宀€骞囬崷銊┾偓姘崇箖sidebarLayoutConfig缂佺喍绔撮幒褍鍩?
	title?: string; // 閸忣剙鎲￠弽蹇旂垼妫?
	content: string; // 閸忣剙鎲￠弽蹇撳敶鐎?
	icon?: string; // 閸忣剙鎲￠弽蹇撴禈閺?
	type?: "info" | "warning" | "success" | "error"; // 閸忣剙鎲＄猾璇茬€?
	closable?: boolean; // 閺勵垰鎯侀崣顖氬彠闂?
	link?: {
		enable: boolean; // 閺勵垰鎯侀崥顖滄暏闁剧偓甯?
		text: string; // 闁剧偓甯撮弬鍥х摟
		url: string; // 闁剧偓甯撮崷鏉挎絻
		external?: boolean; // 閺勵垰鎯佹径鏍劥闁剧偓甯?
	};
};

export type MusicPlayerConfig = {
	enable: boolean; // 閺勵垰鎯侀崥顖滄暏闂婂厖绠伴幘顓熸杹閸ｃ劌濮涢懗?
	mode: "meting" | "local"; // 闂婂厖绠伴幘顓熸杹閸ｃ劍膩瀵?
	meting_api: string; // Meting API 閸︽澘娼?
	id: string; // 濮濆苯宕烮D
	server: string; // 闂婂厖绠板┃鎰箛閸斺€虫珤
	type: string; // 闂婂厖绠扮猾璇茬€?
};

export type FooterConfig = {
	enable: boolean; // 閺勵垰鎯侀崥顖滄暏Footer HTML濞夈劌鍙嗛崝鐔诲厴
	customHtml?: string; // 閼奉亜鐣炬稊濉嘥ML閸愬懎顔愰敍宀€鏁ゆ禍搴㈠潑閸旂姴顦鍫濆娇缁涘淇婇幁?
};

// 缂佸嫪娆㈤柊宥囩枂缁鐎风€规矮绠?
export type WidgetComponentType =
	| "profile"
	| "categories"
	| "toc"
	| "card-toc"
	| "music-player"
	| "site-stats" // 缁旀瑧鍋ｇ紒鐔活吀缂佸嫪娆?
	| "calendar" // 閺冦儱宸荤紒鍕
	| "custom";

export type WidgetComponentConfig = {
	type: WidgetComponentType; // 缂佸嫪娆㈢猾璇茬€?
	position: "top" | "sticky"; // 缂佸嫪娆㈡担宥囩枂閿涙岸銆婇柈銊ユ祼鐎规艾灏崺鐔稿灗缁ɑ鈧冨隘閸?
	class?: string; // 閼奉亜鐣炬稊濉丼S缁鎮?
	style?: string; // 閼奉亜鐣炬稊澶婂敶閼辨梹鐗卞?
	animationDelay?: number; // 閸斻劎鏁惧鎯扮箿閺冨爼妫块敍鍫燁嚑缁夋帪绱?
	responsive?: {
		hidden?: ("mobile" | "tablet" | "desktop")[]; // 閸︺劍瀵氱€规俺顔曟径鍥︾瑐闂呮劘妫?
		collapseThreshold?: number; // 閹舵ê褰旈梼鍫濃偓?
	};
	customProps?: Record<string, any>; // 閼奉亜鐣炬稊澶婄潣閹嶇礉閻劋绨幍鈺佺潔缂佸嫪娆㈤崝鐔诲厴
};

export type SidebarLayoutConfig = {
	properties: WidgetComponentConfig[]; // 缂佸嫪娆㈤柊宥囩枂閸掓銆?
	components: {
		left: WidgetComponentType[];
		right: WidgetComponentType[];
		drawer: WidgetComponentType[];
	};
	defaultAnimation: {
		enable: boolean; // 閺勵垰鎯侀崥顖滄暏姒涙顓婚崝銊ф暰
		baseDelay: number; // 閸╄櫣顢呭鎯扮箿閺冨爼妫块敍鍫燁嚑缁夋帪绱?
		increment: number; // 濮ｅ繋閲滅紒鍕闁帒顤冮惃鍕鏉╃喐妞傞梻杈剧礄濮ｎ偆顫楅敍?
	};
	responsive: {
		breakpoints: {
			mobile: number; // 缁夎濮╃粩顖涙焽閻愮櫢绱檖x閿?
			tablet: number; // 楠炶櫕婢樼粩顖涙焽閻愮櫢绱檖x閿?
			desktop: number; // 濡楀矂娼扮粩顖涙焽閻愮櫢绱檖x閿?
		};
	};
};

export type SakuraConfig = {
	enable: boolean; // 閺勵垰鎯侀崥顖滄暏濡精濮抽悧瑙勬櫏
	sakuraNum: number; // 濡精濮抽弫浼村櫤閿涘矂绮拋?1
	limitTimes: number; // 濡精濮崇搾濠勬櫕闂勬劕鍩楀▎鈩冩殶閿?1娑撶儤妫ら梽鎰儕閻?
	size: {
		min: number; // 濡精濮抽張鈧亸蹇撴槀鐎电鈧秵鏆?
		max: number; // 濡精濮抽張鈧径褍鏄傜€电鈧秵鏆?
	};
	opacity: {
		min: number; // 濡精濮抽張鈧亸蹇庣瑝闁繑妲戞惔?
		max: number; // 濡精濮抽張鈧径褌绗夐柅蹇旀鎼?
	};
	speed: {
		horizontal: {
			min: number; // 濮樻潙閽╃粔璇插З闁喎瀹抽張鈧亸蹇撯偓?
			max: number; // 濮樻潙閽╃粔璇插З闁喎瀹抽張鈧径褍鈧?
		};
		vertical: {
			min: number; // 閸ㄥ倻娲跨粔璇插З闁喎瀹抽張鈧亸蹇撯偓?
			max: number; // 閸ㄥ倻娲跨粔璇插З闁喎瀹抽張鈧径褍鈧?
		};
		rotation: number; // 閺冨娴嗛柅鐔峰
		fadeSpeed: number; // 濞戝牆銇戦柅鐔峰
	};
	zIndex: number; // 鐏炲倻楠囬敍宀€鈥樻穱婵嚺懞鍗炴躬閸氬牓鈧倻娈戠仦鍌滈獓閺勫墽銇?
};

export type FullscreenWallpaperConfig = {
	src:
		| string
		| string[]
		| {
				desktop?: string | string[];
				mobile?: string | string[];
		  }; // 閺€顖涘瘮閸楁洑閲滈崶鍓у閵嗕礁娴橀悧鍥ㄦ殶缂佸嫭鍨ㄩ崚鍡楀焼鐠佸墽鐤嗗宀勬桨缁旑垰鎷扮粔璇插З缁旑垰娴橀悧?
	position?: "top" | "center" | "bottom"; // 婢逛胶鐒婃担宥囩枂閿涘瞼鐡戦崥灞肩艾 object-position
	carousel?: {
		enable: boolean; // 閺勵垰鎯侀崥顖滄暏鏉烆喗鎸?
		interval: number; // 鏉烆喗鎸遍梻鎾閺冨爼妫块敍鍫㈩潡閿?
	};
	zIndex?: number; // 鐏炲倻楠囬敍宀€鈥樻穱婵嗩梿缁剧婀崥鍫モ偓鍌滄畱鐏炲倻楠囬弰鍓с仛
	opacity?: number; // 婢逛胶鐒婇柅蹇旀鎼达讣绱?-1娑斿妫?
	blur?: number; // 閼冲本娅欏Ο锛勭ˇ缁嬪瀹抽敍灞藉礋娴ｅ潮x
};

/**
 * Pio 閻婢樻繛姗€鍘ょ純?
 */
/**
 * 閸掑棔闊╃紒鍕闁板秶鐤?
 */
export type ShareConfig = {
	enable: boolean; // 閺勵垰鎯侀崥顖滄暏閸掑棔闊╅崝鐔诲厴
};

/**
 * Twikoo 评论配置
 */
export type CommentConfig = {
	enable: boolean;
	envId: string;
	region?: string;
	lang?: string;
};
