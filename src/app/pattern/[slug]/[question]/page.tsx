// src/app/pattern/[slug]/[question]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PATTERN_MAP } from '@/data/patterns'
import { PROBLEMS, problemsByPattern } from '@/data/problems'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { ProblemCard } from '@/components/ui/ProblemCard'
import { TopNav } from '@/components/TopNav'
import { GrainOverlay } from '@/components/GrainOverlay'
import { JsonLd } from '@/lib/JsonLd'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_KEYWORDS,
  clampDescription,
  urls,
  patternSlugForProblem,
} from '@/lib/seo'

// ─── Static params ──────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return PROBLEMS.map(p => ({
    slug: patternSlugForProblem(p.patternId),
    question: p.id,
  }))
}

// ─── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; question: string }> }
): Promise<Metadata> {
  const { question } = await params
  const problem = PROBLEMS.find(p => p.id === question)
  if (!problem) {
    return {
      title: 'Problem not found',
      description: 'The requested problem does not exist.',
      robots: { index: false, follow: false },
    }
  }

  const node    = PATTERN_MAP[problem.patternId]
  const slug    = patternSlugForProblem(problem.patternId)
  const canonical = `/pattern/${slug}/${problem.id}`

  // Pull the pattern context into the description so the SERP snippet
  // immediately tells the searcher "this is a <pattern> problem".
  const description = clampDescription(
    `${problem.title} — ${problem.difficulty} ${problem.platform} problem solved with the ` +
    `${node?.label ?? 'DSA'} pattern. ${problem.whyThisPattern}`
  )

  const keywords = [
    problem.title,
    `${problem.title} solution`,
    `${problem.title} ${problem.platform.toLowerCase()}`,
    `${problem.title} ${node?.label ?? 'DSA'}`,
    `${node?.label ?? 'DSA'} pattern`,
    `${problem.difficulty.toLowerCase()} ${problem.platform.toLowerCase()}`,
    ...(problem.tags ?? []),
    ...DEFAULT_KEYWORDS,
  ]

  return {
    title: `${problem.title} — ${problem.difficulty} (${problem.platform})`,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}${canonical}`,
      siteName: SITE_NAME,
      title: `${problem.title} — ${problem.difficulty} ${problem.platform} · ${SITE_NAME}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${problem.title} — ${problem.difficulty}`,
      description,
    },
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function QuestionPage({
  params,
}: { params: Promise<{ slug: string; question: string }> }) {
  const { question } = await params
  const problem = PROBLEMS.find(p => p.id === question)
  if (!problem) notFound()

  const node     = PATTERN_MAP[problem.patternId]
  const parent   = node?.parentId ? PATTERN_MAP[node.parentId] : null
  const siblings = problemsByPattern(problem.patternId).filter(p => p.id !== problem.id).slice(0, 3)
  const color    = node?.color ?? '#6BA9C9'
  const slug     = patternSlugForProblem(problem.patternId)
  const fullUrl  = urls.problem(slug, problem.id)

  const crumbs = [
    { label: 'DSA Patterns', href: '/' },
    ...(parent ? [{ label: parent.label, href: `/pattern/${parent.id}` }] : []),
    ...(node ? [{ label: node.label, href: `/pattern/${node.id}` }] : []),
    { label: problem.title },
  ]

  // ── Structured data ──────────────────────────────────────────────────────
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: `${SITE_URL}/` },
      ...(parent ? [{ '@type': 'ListItem', position: 2, name: parent.label, item: urls.pattern(parent.id) }] : []),
      ...(node   ? [{ '@type': 'ListItem', position: parent ? 3 : 2, name: node.label, item: urls.pattern(node.id) }] : []),
      { '@type': 'ListItem', position: (parent ? 3 : 2) + (node ? 1 : 0), name: problem.title, item: fullUrl },
    ],
  }

  // LearningResource is the canonical schema for a single educational
  // unit (a problem, in our case) with linked teaching material.
  const learningResource = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': `${fullUrl}#resource`,
    name: problem.title,
    description: problem.whyThisPattern,
    url: fullUrl,
    inLanguage: 'en-US',
    learningResourceType: 'Problem',
    educationalLevel:
      problem.difficulty === 'Easy' ? 'Beginner' :
      problem.difficulty === 'Medium' ? 'Intermediate' : 'Advanced',
    teaches: node?.label,
    about: problem.tags?.length ? problem.tags : (node?.label ?? 'DSA'),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#org` },
    keywords: [
      problem.difficulty,
      problem.platform,
      node?.label,
      ...(problem.tags ?? []),
    ].filter(Boolean).join(', '),
    // Reference the original problem on its host platform so Google can
    // link the two as related citations.
    citation: {
      '@type': 'CreativeWork',
      name: `${problem.title} on ${problem.platform}`,
      url: problem.url,
    },
  }

  // Question schema gives Google an explicit "this is a coding question"
  // signal — which combined with the difficulty in the title can land
  // us in the Quiz / Practice-question rich results.
  const questionSchema = {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: problem.title,
    text: `${problem.title} — solve this ${problem.difficulty.toLowerCase()} ${problem.platform} problem using the ${node?.label ?? 'DSA'} pattern.`,
    answerCount: 1,
    acceptedAnswer: {
      '@type': 'Answer',
      text: problem.whyThisPattern,
      url: problem.url,
    },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <GrainOverlay />
      <TopNav />
      <div style={{ paddingTop: '3.5rem' }}>
        {/* Hero */}
        <div style={{
          padding: '3rem 2rem 2.5rem',
          background: `linear-gradient(180deg, ${color}12 0%, transparent 100%)`,
          borderBottom: `1px solid ${color}18`,
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Breadcrumb crumbs={crumbs} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20, marginBottom: 12 }}>
              <DifficultyBadge difficulty={problem.difficulty} />
              <PlatformBadge platform={problem.platform} />
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {problem.title}
            </h1>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 2rem' }}>
          {/* Why this pattern */}
          <div style={{
            background: `${color}09`,
            border: `1px solid ${color}20`,
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 28,
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Why this pattern
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {problem.whyThisPattern}
            </p>
            {node && (
              <p style={{ marginTop: 8, fontSize: '12px', color: node.color, fontFamily: 'var(--font-mono)' }}>
                Pattern: {node.label}
              </p>
            )}
          </div>

          {/* Primary CTA */}
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 10,
              background: color,
              color: '#000',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              marginBottom: 40,
              boxShadow: `0 0 24px ${color}30`,
            }}
          >
            Solve on {problem.platform} ↗
          </a>

          {/* Related problems */}
          {siblings.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                More in {node?.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {siblings.map(p => <ProblemCard key={p.id} problem={p} accentColor={color} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Structured data */}
      <JsonLd id="ld-problem-breadcrumb" data={breadcrumbList} />
      <JsonLd id="ld-problem-resource"   data={learningResource} />
      <JsonLd id="ld-problem-question"   data={questionSchema} />
    </div>
  )
}
