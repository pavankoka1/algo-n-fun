// src/app/pattern/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PATTERN_MAP, PATTERNS } from '@/data/patterns'
import { problemsByPatternOrSubtree } from '@/data/problems'
import { CATEGORY_MAP } from '@/data/categories'
import { ProblemCard } from '@/components/ui/ProblemCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { TopNav } from '@/components/TopNav'
import { GrainOverlay } from '@/components/GrainOverlay'

export async function generateStaticParams() {
  return PATTERNS.map(p => ({ slug: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const node = PATTERN_MAP[slug]
  return {
    title: node ? `${node.label} — algo-n-fun` : 'Pattern — algo-n-fun',
    description: node ? `DSA problems for the ${node.label} pattern.` : '',
  }
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
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
    </div>
  )
}
