// src/app/robots.ts
//
// Generates /robots.txt. We:
//   • allow every search & AI crawler to read every page (the entire site
//     is intentionally indexable — there is no private surface)
//   • disallow Next's internal /api routes from being crawled (none today,
//     but defence-in-depth in case we add server actions later)
//   • point crawlers at the canonical sitemap
//
// Explicit user-agent rules for GPTBot / ClaudeBot / PerplexityBot let the
// next generation of LLM-powered search surfaces ingest the patterns
// cleanly — currently a meaningful share of "best DSA patterns" queries
// resolve through these crawlers.

import type { MetadataRoute } from 'next'
import { urls } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
      // AI / LLM crawlers — explicitly permitted so our pattern pages can
      // power answers in Bing Chat, ChatGPT browsing, Perplexity, etc.
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow: '/',
      },
      {
        userAgent: ['ClaudeBot', 'Claude-Web', 'anthropic-ai'],
        allow: '/',
      },
      {
        userAgent: ['PerplexityBot', 'YouBot', 'Bytespider'],
        allow: '/',
      },
    ],
    sitemap: urls.sitemap(),
    host: urls.home().replace(/\/$/, ''),
  }
}
