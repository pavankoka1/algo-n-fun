// src/app/pattern/[slug]/[question]/page.tsx
import { notFound } from 'next/navigation'
import { PATTERN_MAP, PATTERNS } from '@/data/patterns'
import { PROBLEMS, problemsByPattern } from '@/data/problems'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { ProblemCard } from '@/components/ui/ProblemCard'
import { TopNav } from '@/components/TopNav'
import { GrainOverlay } from '@/components/GrainOverlay'

export async function generateStaticParams() {
  return PROBLEMS.map(p => {
    const node = PATTERN_MAP[p.patternId]
    return { slug: node?.parentId ?? p.patternId, question: p.id }
  })
}

export default async function QuestionPage({
  params,
}: { params: Promise<{ slug: string; question: string }> }) {
  const { slug, question } = await params
  const problem = PROBLEMS.find(p => p.id === question)
  if (!problem) notFound()

  const node     = PATTERN_MAP[problem.patternId]
  const parent   = node?.parentId ? PATTERN_MAP[node.parentId] : null
  const siblings = problemsByPattern(problem.patternId).filter(p => p.id !== problem.id).slice(0, 3)
  const color    = node?.color ?? '#6BA9C9'

  const crumbs = [
    { label: 'DSA Patterns', href: '/' },
    ...(parent ? [{ label: parent.label, href: `/pattern/${parent.id}` }] : []),
    ...(node ? [{ label: node.label, href: `/pattern/${node.id}` }] : []),
    { label: problem.title },
  ]

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
    </div>
  )
}
