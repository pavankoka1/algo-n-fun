// src/app/sitemap.ts
//
// Generates /sitemap.xml at build time. Returns one entry per crawlable
// URL — Google ingests this on first visit and re-checks via lastModified
// to decide what to re-crawl.
//
// We hand out three tiers of priority:
//   1.00  home               — the front door
//   0.80  pattern hubs       — primary content pages (one per pattern node)
//   0.60  individual problems — long-tail leaves
//
// `changeFrequency` is a *hint*, not a contract — Googlebot largely
// ignores it but Bing/Yandex still respect it. We're conservative.

import type { MetadataRoute } from 'next'
import { PATTERNS } from '@/data/patterns'
import { PROBLEMS } from '@/data/problems'
import { urls, patternSlugForProblem, SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1.0,
  }

  const patternEntries: MetadataRoute.Sitemap = PATTERNS
    // Don't emit the synthetic "root" node — it's just the home page in disguise.
    .filter(p => p.id !== 'root')
    .map(p => ({
      url: urls.pattern(p.id),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      // Top-level family hubs (depth 1, 16 of them) get a slight boost over
      // sub-patterns since they're the most discoverable entry points.
      priority: p.depth === 1 ? 0.85 : 0.75,
    }))

  const problemEntries: MetadataRoute.Sitemap = PROBLEMS.map(p => ({
    url: urls.problem(patternSlugForProblem(p.patternId), p.id),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [homeEntry, ...patternEntries, ...problemEntries]
}
