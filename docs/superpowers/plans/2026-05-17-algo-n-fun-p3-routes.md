# algo-n-fun — Phase 3: Routes, Panels & Pages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full navigation flow — intercepting overlay panels (iOS sheet behaviour), full pattern listing pages, and question detail pages. By end of this phase the site is complete and ready to deploy.

**Architecture:** Next.js App Router parallel routes (`@overlay`) with intercepting routes (`(.)pattern/[slug]`) serve the panels over the persistent canvas. Identical components render as full pages when accessed directly via URL. All data is statically imported.

**Prerequisites:** Phase 1 and Phase 2 complete.

---

### Task 13: UI primitives

**Files:**
- Create: `src/components/ui/DifficultyBadge.tsx`
- Create: `src/components/ui/PlatformBadge.tsx`
- Create: `src/components/ui/ProblemCard.tsx`
- Create: `src/components/ui/Breadcrumb.tsx`

- [ ] **Step 1: DifficultyBadge**

```tsx
// src/components/ui/DifficultyBadge.tsx
import type { Difficulty } from '@/data/problems'

const COLORS: Record<Difficulty, string> = {
  Easy:   '#34D399',
  Medium: '#F59E0B',
  Hard:   '#FF6B6B',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const color = COLORS[difficulty]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      background: `${color}18`, border: `1px solid ${color}40`,
      color, fontSize: '11px', fontWeight: 600,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
    }}>
      {difficulty}
    </span>
  )
}
```

- [ ] **Step 2: PlatformBadge**

```tsx
// src/components/ui/PlatformBadge.tsx
import type { Platform } from '@/data/problems'

const META: Record<Platform, { color: string; label: string }> = {
  LeetCode:   { color: '#FF8000', label: 'LeetCode' },
  CodeChef:   { color: '#5B4638', label: 'CodeChef' },
  SPOJ:       { color: '#228B22', label: 'SPOJ' },
  HackerRank: { color: '#00EA64', label: 'HackerRank' },
  GFG:        { color: '#2F8D46', label: 'GFG' },
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  const { color, label } = META[platform]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      background: `${color}14`, border: `1px solid ${color}35`,
      color, fontSize: '11px', fontWeight: 500,
      fontFamily: 'var(--font-mono)',
    }}>
      {label}
    </span>
  )
}
```

- [ ] **Step 3: Breadcrumb**

```tsx
// src/components/ui/Breadcrumb.tsx
import Link from 'next/link'

interface Crumb { label: string; href?: string }

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>›</span>}
          {c.href ? (
            <Link href={c.href} style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
              className="hover:text-[var(--text-primary)] transition-colors">
              {c.label}
            </Link>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: ProblemCard**

```tsx
// src/components/ui/ProblemCard.tsx
import type { Problem } from '@/data/problems'
import { DifficultyBadge } from './DifficultyBadge'
import { PlatformBadge } from './PlatformBadge'

interface Props {
  problem: Problem
  accentColor?: string
}

export function ProblemCard({ problem, accentColor = '#00E5FF' }: Props) {
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${accentColor}18`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.18s, box-shadow 0.18s',
    }}
      className="hover:border-[var(--accent)] hover:shadow-[0_0_20px_rgba(0,229,255,0.06)]"
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <DifficultyBadge difficulty={problem.difficulty} />
        <PlatformBadge platform={problem.platform} />
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
        {problem.title}
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
        {problem.whyThisPattern}
      </p>
      <a
        href={problem.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 12px',
          borderRadius: 7,
          border: `1px solid ${accentColor}30`,
          background: 'transparent',
          color: accentColor,
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          textDecoration: 'none',
          width: 'fit-content',
          transition: 'background 0.15s',
        }}
      >
        Open on {problem.platform} ↗
      </a>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/components/ui/
git commit -m "feat: UI primitives — DifficultyBadge, PlatformBadge, Breadcrumb, ProblemCard"
```

---

### Task 14: Pattern listing page (direct URL)

**Files:**
- Create: `src/app/pattern/[slug]/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/pavankurmarao.k/Documents/personal/algo-n-fun/src/app/pattern/\[slug\]
```

- [ ] **Step 2: Create page.tsx**

```tsx
// src/app/pattern/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PATTERN_MAP, PATTERNS } from '@/data/patterns'
import { problemsByPattern, PROBLEMS } from '@/data/problems'
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

  const category = CATEGORY_MAP[node.category]
  const children = node.childIds.map(id => PATTERN_MAP[id]).filter(Boolean)
  const problems = problemsByPattern(node.id)
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
```

- [ ] **Step 3: Verify**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev &
sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pattern/array
```

Expected: `200`

- [ ] **Step 4: Kill and commit**

```bash
pkill -f "next dev"
git add src/app/pattern/
git commit -m "feat: pattern listing page with sub-patterns, problems, breadcrumb"
```

---

### Task 15: Intercepting route — PatternPanel overlay

**Files:**
- Create: `src/app/@overlay/(.)pattern/[slug]/page.tsx`

- [ ] **Step 1: Create directories**

```bash
mkdir -p "/Users/pavankurmarao.k/Documents/personal/algo-n-fun/src/app/@overlay/(.)pattern/[slug]"
```

- [ ] **Step 2: Create the intercepting route page**

```tsx
// src/app/@overlay/(.)pattern/[slug]/page.tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
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

  const category = CATEGORY_MAP[node.category]
  const children = node.childIds.map(id => PATTERN_MAP[id]).filter(Boolean)
  const problems = problemsByPattern(node.id)
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
        {/* Drag handle (mobile) */}
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
          {/* Colour accent bar */}
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
```

- [ ] **Step 3: Verify**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev &
sleep 8
```

Open `http://localhost:3000`, click a node → "Browse" badge → should trigger the intercepting route and show the slide-in panel over the graph, not navigate away.

- [ ] **Step 4: Kill and commit**

```bash
pkill -f "next dev"
git add "src/app/@overlay/"
git commit -m "feat: PatternPanel intercepting route — iOS-style slide-in over persistent graph"
```

---

### Task 16: Question detail page + intercepting route

**Files:**
- Create: `src/app/pattern/[slug]/[question]/page.tsx`
- Create: `src/app/@overlay/(.)pattern/[slug]/[question]/page.tsx`

- [ ] **Step 1: Create direct question page**

```bash
mkdir -p "/Users/pavankurmarao.k/Documents/personal/algo-n-fun/src/app/pattern/[slug]/[question]"
```

```tsx
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
  const color    = node?.color ?? '#00E5FF'

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
          {/* Pattern context */}
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
              transition: 'transform 0.15s, box-shadow 0.15s',
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
```

- [ ] **Step 2: Create intercepting route for question**

```bash
mkdir -p "/Users/pavankurmarao.k/Documents/personal/algo-n-fun/src/app/@overlay/(.)pattern/[slug]/[question]"
```

```tsx
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
  const color = node?.color ?? '#00E5FF'

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
```

- [ ] **Step 3: Commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/app/pattern/ "src/app/@overlay/"
git commit -m "feat: question detail page + intercepting overlay panel"
```

---

### Task 17: Final wiring, build verification, and deploy prep

**Files:**
- Modify: `next.config.ts`
- Create: `vercel.json`

- [ ] **Step 1: Full TypeScript check**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
npx tsc --noEmit 2>&1 | grep -v "node_modules" | grep "error TS" | head -20
```

Expected: 0 error lines. Fix any that appear before continuing.

- [ ] **Step 2: Build**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no errors.

- [ ] **Step 3: Start production server and smoke test**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run start &
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
curl -s -o /dev/null -w " %{http_code}" http://localhost:3000/pattern/array
curl -s -o /dev/null -w " %{http_code}" http://localhost:3000/pattern/arr-sw-variable/p005
pkill -f "next start"
```

Expected: `200 200 200`

- [ ] **Step 4: Create vercel.json**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci"
}
```

- [ ] **Step 5: Final commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add vercel.json
git commit -m "feat: algo-n-fun complete — cryptex landing, 3D graph, CartographerEye, panels, pages"
```

- [ ] **Step 6: Deploy to Vercel (optional)**

```bash
# Install Vercel CLI if needed: npm i -g vercel
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
vercel --prod
```

---

**Phase 3 complete. algo-n-fun is fully built.**

Full feature list:
- ✅ Da Vinci cryptex GLB landing → particle dissolve → 3D force graph
- ✅ 182 nodes with bloom, InstancedMesh, category colours
- ✅ Hover enlarges, click flies camera + shows badge
- ✅ CartographerEye: orbiting nodes, aperture unlock, ring snap, particle burst
- ✅ Persistent canvas with iOS-style overlay panels via parallel routes
- ✅ Pattern listing + question detail pages (direct URL + intercepting)
- ✅ 30 curated problems linking directly to LeetCode/SPOJ/CodeChef
- ✅ Static build — zero backend, zero cost, Vercel-deployable
