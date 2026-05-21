// src/app/page.tsx
//
// Home — a server component that serves SEO-rich HTML alongside the 3D
// hero canvas. The visual hero is mounted via <HomeCanvasMount> (client),
// while the semantic content layer rendered below provides:
//
//   • A real <h1> with the brand tagline (crucial — Google's first signal
//     for "what is this page?" is the H1 it can actually read).
//   • A paragraph with keyword-rich copy describing the offering.
//   • An accessible navigation list of every top-level pattern category
//     (giving crawlers internal links so they can discover all 182 nodes
//     without having to execute the canvas).
//   • Per-category sub-pattern hint to deepen crawl coverage.
//
// The whole content layer is offscreen-positioned so it does not affect
// the visual experience, but it IS present in the DOM (no display: none)
// — which means it counts toward search-engine indexing and stays
// accessible to screen readers.

import Link from 'next/link'
import { HomeCanvasMount } from '@/components/graph/HomeCanvasMount'
import { JsonLd } from '@/lib/JsonLd'
import { CATEGORIES, CATEGORY_MAP } from '@/data/categories'
import { PATTERNS, PATTERN_MAP } from '@/data/patterns'
import { PROBLEMS } from '@/data/problems'
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  TOTAL_PATTERNS,
  TOTAL_PROBLEMS,
  TOTAL_LEAVES,
  TOTAL_CATEGORIES,
  urls,
} from '@/lib/seo'

// ─── Visually-hidden style (preserves SEO / a11y, hides from sighted users) ──
//
// Standard "sr-only" technique. We can't `display: none` because crawlers
// and screen readers would skip the content; instead we collapse the box
// to 1×1, clip it, and push it off-screen.
//
const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export default function HomePage() {
  // Top-level pattern families (depth === 1). 16 entries by definition.
  const families = PATTERNS.filter(p => p.depth === 1)

  // Pre-compute breadcrumb / item list data for JSON-LD.
  const itemListElement = families.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.label,
    url: urls.pattern(p.id),
  }))

  return (
    <>
      {/* ── Visual hero (3D canvas) ────────────────────────────────────── */}
      <HomeCanvasMount />

      {/* ── Crawler / a11y content layer ──────────────────────────────────
          Offscreen-positioned but fully present in the DOM. */}
      <div style={SR_ONLY} aria-hidden={false}>
        <header>
          <h1>{SITE_NAME} — {SITE_TAGLINE}</h1>
          <p>{DEFAULT_DESCRIPTION}</p>
          <p>
            Explore {TOTAL_PATTERNS} interconnected DSA patterns across{' '}
            {TOTAL_CATEGORIES} families ({TOTAL_LEAVES} leaf techniques),
            with {TOTAL_PROBLEMS}+ curated coding-interview problems from
            LeetCode, GeeksforGeeks, HackerRank, CodeChef, and SPOJ — each
            tagged with the underlying pattern, difficulty, and a short
            &ldquo;why this pattern&rdquo; explainer.
          </p>
        </header>

        <nav aria-label="DSA pattern families">
          <h2>Browse all DSA pattern families</h2>
          <ul>
            {families.map(family => {
              const cat   = CATEGORY_MAP[family.category]
              const subs  = family.childIds
                .map(id => PATTERN_MAP[id])
                .filter(Boolean)
              return (
                <li key={family.id}>
                  <Link href={`/pattern/${family.id}`}>
                    {family.label}
                  </Link>
                  {cat ? <> — {cat.label}</> : null}
                  {subs.length > 0 && (
                    <ul>
                      {subs.map(sub => (
                        <li key={sub.id}>
                          <Link href={`/pattern/${sub.id}`}>{sub.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <section>
          <h2>What you&rsquo;ll find inside</h2>
          <ul>
            <li>
              Pattern-first navigation: every problem is filed under the
              technique that unlocks it (two-pointer, sliding window,
              monotonic stack, BFS, Dijkstra, Kadane&rsquo;s, KMP, segment tree,
              Fenwick tree, union-find, bitmask DP, and many more).
            </li>
            <li>
              An interactive 3D galaxy that lets you visually traverse the
              relationship between {TOTAL_CATEGORIES} algorithm categories
              and their {TOTAL_LEAVES} leaf patterns.
            </li>
            <li>
              Curated practice sets from FAANG interview repositories,
              competitive-programming sites, and classic algorithm
              textbooks — each annotated with difficulty and a &ldquo;why this
              pattern&rdquo; hint.
            </li>
            <li>
              Built for engineers preparing for coding interviews at
              FAANG, fintech, and startups; for university students
              learning data structures; and for competitive programmers
              practising contest patterns.
            </li>
          </ul>
        </section>

        <section>
          <h2>Popular categories</h2>
          <p>
            Array · String · Hash Map · Stack · Queue · Linked List ·
            Trees · Recursion · Heap · Graphs · Trie · Dynamic Programming
            · Greedy · Bit Manipulation · Sorting · Range Structures.
          </p>
        </section>
      </div>

      {/* ── Structured data for the home route ─────────────────────────── */}
      <JsonLd
        id="ld-home-breadcrumb"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${SITE_URL}/`,
            },
          ],
        }}
      />
      <JsonLd
        id="ld-home-collection"
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${SITE_NAME} — DSA pattern index`,
          description: DEFAULT_DESCRIPTION,
          url: `${SITE_URL}/`,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          about: CATEGORIES.map(c => ({
            '@type': 'Thing',
            name: c.label,
          })),
          mainEntity: {
            '@type': 'ItemList',
            name: 'DSA pattern families',
            numberOfItems: families.length,
            itemListElement,
          },
        }}
      />
      <JsonLd
        id="ld-home-faq"
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is algo-n-fun?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: `algo-n-fun is an interactive 3D atlas of ${TOTAL_PATTERNS} data-structure and algorithm patterns, with ${TOTAL_PROBLEMS}+ curated coding-interview problems tagged by the pattern that solves them.`,
              },
            },
            {
              '@type': 'Question',
              name: 'Who is it for?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Engineers preparing for coding interviews at FAANG and startups, university students learning DSA, and competitive programmers practising contest patterns.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is it free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Every pattern, problem, and visualization is free to explore — no signup required.',
              },
            },
            {
              '@type': 'Question',
              name: 'How are problems chosen?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: `Problems are curated from LeetCode, GeeksforGeeks, HackerRank, CodeChef, and SPOJ. Each of the ${PROBLEMS.length} problems is tagged with its underlying pattern and a short "why this pattern" rationale.`,
              },
            },
          ],
        }}
      />
    </>
  )
}
