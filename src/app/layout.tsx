// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { GrainOverlay } from '@/components/GrainOverlay'
import { JsonLd } from '@/lib/JsonLd'
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_LOCALE,
  SITE_TWITTER,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from '@/lib/seo'
import './globals.css'

// ─── Metadata ────────────────────────────────────────────────────────────────
//
// `metadataBase` is the linchpin: every relative URL elsewhere (OG images,
// alternates, manifest) is resolved against it. Without it, Next emits
// warnings in dev and crawlers fall back to relative paths (= broken
// social previews).
//
// `title.template` lets child pages set just their `title` and Next will
// auto-append the brand suffix (" · algo-n-fun"). Cleaner than every
// page restating the brand.
//
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',

  // Tell crawlers exactly what they can do. The max-* directives let
  // Google build richer SERP snippets.
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // Canonical URL for the home page. Child routes override this via their
  // own generateMetadata.
  alternates: {
    canonical: '/',
  },

  // Open Graph — used by Facebook, LinkedIn, Slack, Discord, iMessage,
  // and most messaging apps. The 1200×630 OG image is auto-served from
  // app/opengraph-image.tsx (Next picks it up by file convention).
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: SITE_LOCALE,
  },

  // Twitter card — reuses the OG image automatically; we just
  // declare the card style and creator handle.
  twitter: {
    card: 'summary_large_image',
    site: SITE_TWITTER,
    creator: SITE_TWITTER,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },

  // Icon stack. The .ico in /src/app is auto-picked up; we also declare
  // an Apple touch icon for iOS home-screen pins.
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },

  manifest: '/manifest.webmanifest',

  // Search-console verification slot. Wired through env so we can attach
  // the property once without redeploying production. Empty values are
  // omitted from the final <head> by Next.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },

  // Format detection: stop iOS Safari from auto-linking algorithm names
  // it mistakes for phone numbers / addresses.
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  other: {
    // Explicit content-type hint for AI / archival crawlers.
    'content-type': 'text/html; charset=utf-8',
  },
}

// ─── Viewport ────────────────────────────────────────────────────────────────
//
// Split out per Next 16 convention. `themeColor` controls the URL-bar tint
// on Android Chrome / iOS Safari, which contributes to the "branded look"
// SEO signal Google uses when rendering its mobile preview.
//
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#03030A' },
    { media: '(prefers-color-scheme: light)', color: '#03030A' },
  ],
  colorScheme: 'dark',
}

export default function RootLayout({ children, overlay }: {
  children: React.ReactNode
  overlay?: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <GrainOverlay />
        <main>{children}</main>
        {overlay}

        {/* Site-wide JSON-LD. Two entities:
            • WebSite — declares the search action & inLanguage
            • Organization — supplies a publisher Google can attribute
            Page-specific schemas (BreadcrumbList, LearningResource,
            QAPage) are emitted from their respective pages. */}
        <JsonLd
          id="ld-website"
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE_NAME,
            alternateName: SITE_TAGLINE,
            description: DEFAULT_DESCRIPTION,
            inLanguage: 'en-US',
            publisher: { '@id': `${SITE_URL}/#org` },
          }}
        />
        <JsonLd
          id="ld-org"
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${SITE_URL}/#org`,
            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_TAGLINE,
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/favicon.ico`,
            },
          }}
        />
      </body>
    </html>
  )
}
