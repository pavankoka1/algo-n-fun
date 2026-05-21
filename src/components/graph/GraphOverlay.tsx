'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGraphStore } from '@/hooks/useGraphStore'
import { PATTERN_MAP } from '@/data/patterns'
import { problemsByPatternOrSubtree } from '@/data/problems'

export function GraphOverlay() {
  const focusedId  = useGraphStore(s => s.focusedNodeId)
  const setFocused = useGraphStore(s => s.setFocused)
  const router     = useRouter()
  const node       = focusedId ? PATTERN_MAP[focusedId] : null
  const problems   = node ? problemsByPatternOrSubtree(node.id) : []

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(10,10,20,0.92)',
            border: `1px solid ${node.color}30`,
            borderRadius: 16,
            padding: '14px 20px',
            backdropFilter: 'blur(16px)',
            minWidth: 260,
            maxWidth: 360,
            boxShadow: `0 0 32px ${node.color}18`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              depth {node.depth}
            </span>
            <span style={{ flex: 1 }} />
            <button
              onClick={() => setFocused(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
              aria-label="Close"
            >×</button>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {node.label}
          </h3>

          {problems.length > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12 }}>
              {problems.length} problem{problems.length > 1 ? 's' : ''} curated
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!node.isLeaf && node.childIds?.length > 0 && (
              <button
                onClick={() => router.push(`/pattern/${node.id}`)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1px solid ${node.color}40`,
                  background: `${node.color}12`,
                  color: node.color,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                Browse {node.childIds.length} sub-patterns →
              </button>
            )}
            {node.isLeaf && problems.length > 0 && (
              <button
                onClick={() => router.push(`/pattern/${node.parentId}/${node.id}`)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: node.color,
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                View problems →
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
