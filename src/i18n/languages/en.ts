import Key from "../i18nKey";
import type { Translation } from "../translation";

export const en: Translation = {
  [Key.home]: "Home",
  [Key.archive]: "Archive",
  [Key.search]: "Search",

  [Key.tags]: "Tags",
  [Key.categories]: "Categories",
  [Key.recentPosts]: "Recent Posts",
  [Key.tableOfContents]: "Table of Contents",
  [Key.tocEmpty]: "No table of contents",

  [Key.friends]: "Friends",
  [Key.friendsSubtitle]: "Discover more great websites",
  [Key.friendsSearchPlaceholder]: "Search friend's name or description...",
  [Key.friendsFilterAll]: "All",
  [Key.friendsNoResults]: "No matching friends found",
  [Key.friendsVisit]: "Visit",
  [Key.friendsCopyLink]: "Copy Link",
  [Key.friendsCopySuccess]: "Copied",
  [Key.friendsTags]: "Tags",
  [Key.untitled]: "Untitled",
  [Key.uncategorized]: "Uncategorized",
  [Key.noTags]: "No Tags",

  [Key.wordCount]: "word",
  [Key.wordsCount]: "words",
  [Key.minuteCount]: "minute",
  [Key.minutesCount]: "minutes",
  [Key.postCount]: "post",
  [Key.postsCount]: "posts",

  [Key.themeColor]: "Theme Color",

  [Key.lightMode]: "Light",
  [Key.darkMode]: "Dark",
  [Key.systemMode]: "System",

  [Key.more]: "More",

  [Key.author]: "Author",
  [Key.publishedAt]: "Published at",
  [Key.license]: "License",
  [Key.comments]: "Comments",

  // 404 Page
  [Key.notFound]: "404",
  [Key.notFoundTitle]: "Page Not Found",
  [Key.notFoundDescription]:
    "Sorry, the page you visited does not exist or has been moved.",
  [Key.backToHome]: "Back to Home",

  // Music Player
  [Key.musicPlayer]: "Music Player",
  [Key.musicPlayerShow]: "Show Music Player",
  [Key.musicPlayerHide]: "Hide Music Player",
  [Key.musicPlayerExpand]: "Expand Music Player",
  [Key.musicPlayerCollapse]: "Collapse Music Player",
  [Key.musicPlayerPause]: "Pause",
  [Key.musicPlayerPlay]: "Play",
  [Key.musicPlayerPrevious]: "Previous",
  [Key.musicPlayerNext]: "Next",
  [Key.musicPlayerShuffle]: "Shuffle",
  [Key.musicPlayerRepeat]: "Repeat All",
  [Key.musicPlayerRepeatOne]: "Repeat One",
  [Key.musicPlayerVolume]: "Volume Control",
  [Key.musicPlayerProgress]: "Playback Progress",
  [Key.musicPlayerCover]: "Cover",
  [Key.musicPlayerPlaylist]: "Playlist",
  [Key.musicPlayerLoading]: "Loading...",
  [Key.musicPlayerErrorPlaylist]: "Failed to fetch playlist",
  [Key.musicPlayerErrorSong]: "Failed to load current song, trying next",
  [Key.musicPlayerErrorEmpty]: "No available songs in playlist",
  [Key.unknownSong]: "Unknown Song",
  [Key.unknownArtist]: "Unknown Artist",

  // Albums Page
  [Key.albums]: "Albums",
  [Key.albumsSubtitle]: "Record beautiful moments in life",
  [Key.albumsEmpty]: "No content",
  [Key.albumsEmptyDesc]:
    "No albums have been created yet. Go add some beautiful memories!",
  [Key.albumsBackToList]: "Back to Albums",
  [Key.albumsPhotoCount]: "photo",
  [Key.albumsPhotosCount]: "photos",

  // Password Protection
  [Key.passwordProtected]: "Password Protected",
  [Key.passwordProtectedTitle]: "This content is password protected",
  [Key.passwordProtectedDescription]:
    "Please enter the password to view the protected content",
  [Key.passwordPlaceholder]: "Enter password",
  [Key.passwordUnlock]: "Unlock",
  [Key.passwordUnlocking]: "Unlocking...",
  [Key.passwordIncorrect]: "Incorrect password, please try again",
  [Key.passwordDecryptError]:
    "Decryption failed, please check if the password is correct",
  [Key.passwordRequired]: "Please enter the password",
  [Key.passwordVerifying]: "Verifying...",
  [Key.passwordDecryptFailed]: "Decryption failed, please check the password",
  [Key.passwordDecryptRetry]: "Decryption failed, please try again",
  [Key.passwordUnlockButton]: "Unlock",
  [Key.copyFailed]: "Copy failed:",
  [Key.syntaxHighlightFailed]: "Syntax highlighting failed:",
  [Key.autoSyntaxHighlightFailed]: "Automatic syntax highlighting also failed:",
  [Key.decryptionError]: "An error occurred during decryption:",

  // Site Stats
  [Key.siteStats]: "Site Statistics",
  [Key.siteStatsPostCount]: "Posts",
  [Key.siteStatsCategoryCount]: "Categories",
  [Key.siteStatsTagCount]: "Tags",
  [Key.siteStatsTotalWords]: "Words",
  [Key.siteStatsRunningDays]: "Running Days",
  [Key.siteStatsDaysAgo]: "{days} days ago",
  [Key.siteStatsDays]: "{days} days",

  // Share Functionality
  [Key.shareArticle]: "Share",
  [Key.generatingPoster]: "Generating poster...",
  [Key.copied]: "Copied",
  [Key.copyLink]: "Copy Link",
  [Key.savePoster]: "Save Poster",
  [Key.scanToRead]: "Scan to Read",
  [Key.shareOnSocial]: "Share",
  [Key.shareOnSocialDescription]:
    "If this article helped you, please share it with others!",

  // Profile Stats
  [Key.profileStatsLoading]: "Loading stats...",
  [Key.profileStatsPageViews]: "Page views",
  [Key.profileStatsVisits]: "Visits",
  [Key.profileStatsUnavailable]: "Stats unavailable",

  // Page Views Stats
  [Key.pageViewsLoading]: "Loading stats...",
  [Key.pageViewsUnavailable]: "Stats unavailable",
};