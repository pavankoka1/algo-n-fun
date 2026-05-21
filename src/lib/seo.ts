// src/lib/seo.ts
//
// Single source of truth for SEO. Every page, sitemap entry, OG image,
// JSON-LD block, and robots rule reads from here so the site speaks with
// one voice across every crawler surface.
//
// Override the production origin by setting NEXT_PUBLIC_SITE_URL at build
// time (Vercel project settings → Environment Variables). Defaults to the
// Vercel preview domain so previews still emit absolute URLs.
//
// IMPORTANT: keep this module dependency-free (no React, no fs) — it is
// imported from server metadata, route handlers, edge runtimes, and OG
// image generators.

import { PATTERNS, PATTERN_MAP } from '@/data/patterns'
import { PROBLEMS } from '@/data/problems'
import { CATEGORIES } from '@/data/categories'

// ── Origin ──────────────────────────────────────────────────────────────────
// Strip any trailing slash so we can safely concatenate paths.
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
  'https://algo-n-fun.vercel.app'

const NORMALIZED =
  RAW_SITE_URL.startsWith('http') ? RAW_SITE_URL : `https://${RAW_SITE_URL}`

export const SITE_URL = NORMALIZED.replace(/\/+$/, '')

// ── Brand ───────────────────────────────────────────────────────────────────
export const SITE_NAME      = 'algo-n-fun'
export const SITE_TAGLINE   = 'Crack the Pattern. Own the Problem.'
export const SITE_AUTHOR    = 'algo-n-fun'
export const SITE_LOCALE    = 'en_US'
export const SITE_TWITTER   = '@algonfun'   // best-guess handle; safe to update later

// ── Counts (computed once, baked into copy) ─────────────────────────────────
export const TOTAL_PATTERNS  = PATTERNS.length
export const TOTAL_LEAVES    = PATTERNS.filter(p => p.isLeaf).length
export const TOTAL_PROBLEMS  = PROBLEMS.length
export const TOTAL_CATEGORIES = CATEGORIES.length

// ── Default copy ────────────────────────────────────────────────────────────
//
// The description is the second-most important SEO surface after the
// title. It's keyword-dense without being keyword-stuffed; covers the
// core intent ("learn DSA patterns", "coding interview prep"); and
// previews the number-driven proof points the rest of the site fulfils.
//
export const DEFAULT_TITLE       = `${SITE_NAME} — ${SITE_TAGLINE}`
export const DEFAULT_SHORT_TITLE = SITE_NAME

export const DEFAULT_DESCRIPTION =
  `${TOTAL_PATTERNS} data-structure & algorithm patterns mapped as an ` +
  `interactive 3D galaxy. Browse ${TOTAL_LEAVES} leaf techniques, ` +
  `${TOTAL_PROBLEMS}+ curated LeetCode-style problems, and learn ` +
  `the underlying pattern behind every solution. ` +
  `Built for engineers preparing for coding interviews at FAANG, ` +
  `startups, and competitive programming contests.`

// ── Keyword list ────────────────────────────────────────────────────────────
//
// Google ignores the keywords meta — but Bing, DuckDuckGo, Yandex, and
// many AI search crawlers still parse it. Cheap to include, no SEO penalty.
//
export const DEFAULT_KEYWORDS: string[] = [
  'DSA',
  'data structures',
  'algorithms',
  'coding interview',
  'LeetCode',
  'system design prep',
  'DSA patterns',
  'algorithm patterns',
  'sliding window',
  'two pointers',
  'dynamic programming',
  'graph algorithms',
  'binary search',
  'recursion',
  'backtracking',
  'greedy algorithms',
  'tree traversal',
  'heap',
  'trie',
  'bit manipulation',
  'FAANG interview',
  'competitive programming',
  'software engineering interview',
  'algorithm visualization',
  'interactive learning',
]

// ── URL builders ────────────────────────────────────────────────────────────
export const urls = {
  home:    () => `${SITE_URL}/`,
  pattern: (slug: string) => `${SITE_URL}/pattern/${slug}`,
  problem: (slug: string, question: string) =>
    `${SITE_URL}/pattern/${slug}/${question}`,
  sitemap: () => `${SITE_URL}/sitemap.xml`,
} as const

// ── Resolve the canonical pattern slug for a problem ────────────────────────
//
// Problems route under their leaf pattern's *parent* (so the URL hierarchy
// stays shallow). This helper centralises that rule so sitemap, breadcrumb,
// and metadata all agree.
//
export function patternSlugForProblem(patternId: string): string {
  const node = PATTERN_MAP[patternId]
  return node?.parentId ?? patternId
}

// ── Helper: clamp text to a safe meta length ────────────────────────────────
export function clampDescription(text: string, max = 158): string {
  if (text.length <= max) return text
  // Cut at last word boundary so the description doesn't end mid-word
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : cut.length).trimEnd()}…`
}
