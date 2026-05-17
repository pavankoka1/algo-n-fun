// src/app/@overlay/(.)pattern/[slug]/page.tsx
'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { PATTERN_MAP } from '@/data/patterns'
import { problemsByPattern } from '@/data/problems'
import { CATEGORY_MAP } from '@/data/categories'
import { ProblemCard } from '@/components/ui/ProblemCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import Link from 'next/link'

export default function PatternPanelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const node    = PATTERN_MAP[slug]
  const router  = useRouter()

  if (!node) return null

  const category   = CATEGORY_MAP[node.category]
  const children   = node.childIds.map(id => PATTERN_MAP[id]).filter(Boolean)
  const problems   = problemsByPattern(node.id)
  const parentNode = node.parentId ? PATTERN_MAP[node.parentId] : null

  const crumbs = [
    { label: 'Graph', href: '/' },
    ...(parentNode && parentNode.depth > 0 ? [{ label: parentNode.label, href: `/pattern/${parentNode.id}` }] : []),
    { label: node.label },
  ]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => router.back()}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(3,3,10,0.45)',
          backdropFilter: 'blur(4px)',
          cursor: 'pointer',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(440px, 100vw)',
          zIndex: 300,
          background: 'rgba(8,8,18,0.97)',
          borderLeft: `1px solid ${node.color}20`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        aria-label={`${node.label} pattern panel`}
      >
        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(8,8,18,0.97)', padding: '12px 20px 0', zIndex: 10 }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Breadcrumb crumbs={crumbs} />
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, padding: 4, flexShrink: 0 }}
              aria-label="Close panel"
            >×</button>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${node.color}50, transparent)`, marginTop: 10 }} />
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px 40px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, boxShadow: `0 0 10px ${node.color}` }} />
            <span style={{ fontSize: '10px', color: node.color, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {category?.label} · depth {node.depth}
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 16 }}>
            {node.label}
          </h2>

          {children.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                Sub-patterns
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {children.map(child => (
                  <Link key={child.id} href={`/pattern/${child.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 7,
                      border: `1px solid ${node.color}22`,
                      background: `${node.color}07`,
                      color: 'var(--text-primary)',
                      fontSize: '12px', textDecoration: 'none',
                    }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: child.color }} />
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {problems.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                Problems
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {problems.map(p => (
                  <ProblemCard key={p.id} problem={p} accentColor={node.color} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}
