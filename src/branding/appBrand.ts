/** Public product branding for Doodh Wala (user-facing only). */
import { env } from '../config/env'
import logoMark from './assets/logo_mark.png'
import logoMarkMono from './assets/logo_mark_mono.png'
import logoMarkOnDark from './assets/logo_mark_on_dark.png'
import faviconPng from './assets/favicon.png'
import avatarPlaceholderPng from './assets/avatar_placeholder.png'

export const appBrand = {
  name: env.appName,
  shortName: env.appName,
  tagline: 'Fresh milk. Trusted delivery.',
  supportEmail: 'support@doodhwala.app',
  supportPhone: '+91 00000 00000',
  websiteUrl: 'https://doodhwala.app',
  /** Bullet + rear milk-cans — Vite-bundled PNGs (public/ PNG serve is flaky). */
  logoFull: logoMark,
  logoCompact: logoMark,
  logoMono: logoMarkMono,
  logoOnDark: logoMarkOnDark,
  logoOnLight: logoMark,
  favicon: faviconPng,
  avatarPlaceholder: avatarPlaceholderPng,
} as const

export type AppBrand = typeof appBrand
