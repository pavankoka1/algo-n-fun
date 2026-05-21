// src/app/manifest.ts
//
// Generates /manifest.webmanifest. The manifest tells Chrome / Edge / Safari
// how to render the site as an installable PWA (home-screen icon, theme
// colours, splash screen). A valid manifest contributes to:
//
//   • Lighthouse "Installable" + "PWA Optimized" categories (ranking signal)
//   • iOS Safari "Add to Home Screen" naming
//   • Android Chrome address-bar tint
//   • Google's "App-Like" badges in mobile SERPs
//
// We keep the icon list intentionally minimal — favicon.ico is mask-friendly
// at small sizes. If we later add maskable PNG icons, drop them in /public
// and extend the `icons` array.

import type { MetadataRoute } from 'next'
import {
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
} from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#03030A',
    theme_color: '#03030A',
    categories: ['education', 'productivity', 'developer'],
    lang: 'en-US',
    dir: 'ltr',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48 32x32 16x16',
        type: 'image/x-icon',
      },
    ],
  }
}
