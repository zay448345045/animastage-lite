import { ANDROID_RELEASE, SITE_URL } from './androidRelease';

export { SITE_URL, ANDROID_RELEASE };

export const BRAND_TAGLINE = 'AnimaStage Lite — Official Browser MMD Studio';

export const OFFICIAL_PROJECT = {
  siteUrl: SITE_URL,
  liteRepo: 'https://github.com/FBNonaMe/animastage-lite',
  proRepo: 'https://github.com/gtausa197-svg/AnimaStage-Pro',
  proSite: 'https://animastagepro.dev/',
  /** AnimaStage Lite — this site & open-source repo */
  liteAuthorName: 'FBNonaMe',
  liteAuthorUrl: 'https://github.com/FBNonaMe',
  /** AnimaStage Pro — advanced edition */
  proAuthorName: 'gtausa197',
  proAuthorUrl: 'https://github.com/gtausa197-svg',
  statement: 'This is the official and primary source of the AnimaStage project',
} as const;

/** Primary author for AnimaStage Lite (SEO schema on this site). */
export const LITE_AUTHOR = {
  name: OFFICIAL_PROJECT.liteAuthorName,
  url: OFFICIAL_PROJECT.liteAuthorUrl,
} as const;

export const PRO_AUTHOR = {
  name: OFFICIAL_PROJECT.proAuthorName,
  url: OFFICIAL_PROJECT.proAuthorUrl,
} as const;

export const SEO_LANDING_ROUTES = [
  { path: '/mmd-android', label: 'MMD Android' },
  { path: '/mmd-browser', label: 'MMD Browser' },
  { path: '/mmd-online', label: 'MMD Online' },
] as const;
