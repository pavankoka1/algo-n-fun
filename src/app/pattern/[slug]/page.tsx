// src/app/pattern/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PATTERN_MAP, PATTERNS } from '@/data/patterns'
import { problemsByPatternOrSubtree } from '@/data/problems'
import { CATEGORY_MAP } from '@/data/categories'
import { ProblemCard } from '@/components/ui/ProblemCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { TopNav } from '@/components/TopNav'
import { GrainOverlay } from '@/components/GrainOverlay'
import { JsonLd } from '@/lib/JsonLd'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_KEYWORDS,
  clampDescription,
  urls,
} from '@/lib/seo'

// ─── Static params ──────────────────────────────────────────────────────────
// One page per pattern so every route ships fully pre-rendered HTML at
// build time — maximises crawl efficiency and Core Web Vitals.
export async function generateStaticParams() {
  return PATTERNS.map(p => ({ slug: p.id }))
}

// ─── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const node = PATTERN_MAP[slug]

  if (!node) {
    return {
      title: 'Pattern not found',
      description: 'The requested DSA pattern does not exist.',
      robots: { index: false, follow: false },
    }
  }

  const category   = CATEGORY_MAP[node.category]
  const problems   = problemsByPatternOrSubtree(node.id)
  const children   = node.childIds.map(id => PATTERN_MAP[id]).filter(Boolean)
  const isFamily   = node.depth === 1
  const isLeaf     = node.isLeaf

  // Build a keyword-dense, intent-matching description. Targets the
  // long-tail "<pattern name> dsa", "<pattern name> leetcode", and
  // "<pattern name> coding interview pattern" queries.
  const descriptionParts = [
    `${node.label}${category ? ` (${category.label})` : ''}`,
    isLeaf
      ? '— a leaf DSA pattern'
      : isFamily
        ? '— a top-level DSA pattern family'
        : '— a DSA sub-pattern',
    'on algo-n-fun.',
  ]
  if (problems.length > 0) {
    descriptionParts.push(
      `${problems.length} curated coding-interview problem${problems.length > 1 ? 's' : ''} with the underlying pattern explained.`
    )
  }
  if (children.length > 0) {
    descriptionParts.push(
      `Includes ${children.length} sub-pattern${children.length > 1 ? 's' : ''}: ${children.slice(0, 4).map(c => c.label).join(', ')}${children.length > 4 ? '…' : ''}.`
    )
  }
  const description = clampDescription(descriptionParts.join(' '))

  // Keywords: blend the generic site keywords with pattern-specific terms.
  const keywords = [
    node.label,
    `${node.label} pattern`,
    `${node.label} algorithm`,
    `${node.label} leetcode`,
    `${node.label} coding interview`,
    ...(category ? [category.label] : []),
    ...DEFAULT_KEYWORDS,
  ]

  const canonical = `/pattern/${node.id}`

  return {
    title: `${node.label} — DSA Pattern`,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: urls.pattern(node.id),
      siteName: SITE_NAME,
      title: `${node.label} — DSA Pattern · ${SITE_NAME}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${node.label} — DSA Pattern`,
      description,
    },
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function PatternPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const node = PATTERN_MAP[slug]
  if (!node) notFound()

  const category   = CATEGORY_MAP[node.category]
  const children   = node.childIds.map(id => PATTERN_MAP[id]).filter(Boolean)
  const problems   = problemsByPatternOrSubtree(node.id)
  const parentNode = node.parentId ? PATTERN_MAP[node.parentId] : null

  const crumbs = [
    { label: 'DSA Patterns', href: '/' },
    ...(parentNode && parentNode.depth > 0 ? [{ label: parentNode.label, href: `/pattern/${parentNode.id}` }] : []),
    { label: node.label },
  ]

  // ── Structured-data blocks ────────────────────────────────────────────────
  // Breadcrumb mirrors the visual breadcrumb so Google shows
  // "DSA Patterns › <Parent> › <Pattern>" in the SERP.
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`,
      },
      ...(parentNode && parentNode.depth > 0
        ? [{
            '@type': 'ListItem',
            position: 2,
            name: parentNode.label,
            item: urls.pattern(parentNode.id),
          }]
        : []),
      {
        '@type': 'ListItem',
        position: parentNode && parentNode.depth > 0 ? 3 : 2,
        name: node.label,
        item: urls.pattern(node.id),
      },
    ],
  }

  // LearningResource is the most precise schema for an educational
  // technique page — supported by Google's structured-data report.
  const learningResource = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${urls.pattern(node.id)}#resource`,
    name: `${node.label} — DSA Pattern`,
    description:
      `${node.label}${category ? ` is a ${category.label} pattern` : ''}` +
      ` with ${problems.length} curated coding-interview problem${problems.length === 1 ? '' : 's'}.`,
    url: urls.pattern(node.id),
    inLanguage: 'en-US',
    educationalLevel: node.depth >= 3 ? 'Advanced' : node.depth === 2 ? 'Intermediate' : 'Beginner',
    learningResourceType: 'Pattern',
    teaches: node.label,
    about: category?.label ?? 'Data Structures and Algorithms',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#org` },
  }

  // If we have associated problems, expose them as an ItemList — this is
  // what powers the "problems mentioned" rich result for educational pages.
  const itemList = problems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${node.label} — practice problems`,
    numberOfItems: problems.length,
    itemListElement: problems.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: urls.problem(parentNode?.id ?? node.id, p.id),
    })),
  } : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <GrainOverlay />
      <TopNav />
      <div style={{ paddingTop: '3.5rem' }}>
        {/* Hero */}
        <div style={{
          padding: '3rem 2rem 2rem',
          background: `linear-gradient(180deg, ${node.color}10 0%, transparent 100%)`,
          borderBottom: `1px solid ${node.color}18`,
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Breadcrumb crumbs={crumbs} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: node.color, boxShadow: `0 0 16px ${node.color}` }} />
              <span style={{ fontSize: '11px', color: node.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {category?.label ?? node.category} · depth {node.depth}
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 10, letterSpacing: '-0.02em' }}>
              {node.label}
            </h1>
            {problems.length > 0 && (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: 8 }}>
                {problems.length} curated problem{problems.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
          {/* Child patterns */}
          {children.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                Sub-patterns
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {children.map(child => (
                  <Link key={child.id} href={`/pattern/${child.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8,
                      border: `1px solid ${node.color}25`,
                      background: `${node.color}08`,
                      color: 'var(--text-primary)',
                      fontSize: '13px', textDecoration: 'none',
                      fontFamily: 'var(--font-sans)',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: child.color, flexShrink: 0 }} />
                    {child.label}
                    {child.childIds.length > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({child.childIds.length})</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Problems */}
          {problems.length > 0 && (
            <section>
              <h2 style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
                Problems
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
                {problems.map(p => (
                  <ProblemCard key={p.id} problem={p} accentColor={node.color} />
                ))}
              </div>
            </section>
          )}

          {problems.length === 0 && children.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              No problems curated yet for this pattern. More coming soon.
            </p>
          )}
        </div>
      </div>

      {/* Structured data */}
      <JsonLd id="ld-pattern-breadcrumb" data={breadcrumbList} />
      <JsonLd id="ld-pattern-resource"  data={learningResource} />
      {itemList && <JsonLd id="ld-pattern-problems" data={itemList} />}
    </div>
  )
}
