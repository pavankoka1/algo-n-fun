// src/app/@overlay/(.)pattern/[slug]/[question]/page.tsx
'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { PROBLEMS } from '@/data/problems'
import { PATTERN_MAP } from '@/data/patterns'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { PlatformBadge } from '@/components/ui/PlatformBadge'

export default function QuestionPanelPage({ params }: { params: Promise<{ slug: string; question: string }> }) {
  const { question } = use(params)
  const router  = useRouter()
  const problem = PROBLEMS.find(p => p.id === question)

  if (!problem) return null

  const node  = PATTERN_MAP[problem.patternId]
  const color = node?.color ?? '#6BA9C9'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => router.back()}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(3,3,10,0.55)', backdropFilter: 'blur(6px)', cursor: 'pointer' }}
        aria-hidden="true"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(480px, 100vw)', zIndex: 300,
          background: 'rgba(8,8,18,0.98)',
          borderLeft: `1px solid ${color}20`,
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(8,8,18,0.98)', padding: '12px 20px 0', zIndex: 10 }}>
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1 }} aria-label="Close">×</button>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${color}50, transparent)` }} />
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 40px', flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <DifficultyBadge difficulty={problem.difficulty} />
            <PlatformBadge platform={problem.platform} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.25 }}>
            {problem.title}
          </h2>
          <div style={{
            background: `${color}09`, border: `1px solid ${color}20`,
            borderRadius: 10, padding: '14px 16px', marginBottom: 24,
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Why this pattern
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {problem.whyThisPattern}
            </p>
          </div>
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', borderRadius: 9,
              background: color, color: '#000',
              fontSize: '13px', fontWeight: 700,
              textDecoration: 'none',
              boxShadow: `0 0 20px ${color}28`,
            }}
          >
            Solve on {problem.platform} ↗
          </a>
        </div>
      </motion.aside>
    </>
  )
}
