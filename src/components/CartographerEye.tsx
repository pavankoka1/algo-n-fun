// src/components/CartographerEye.tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '@/data/categories'

const WITTY = [
  'Pattern unlocked. Now go solve something.',
  '182 patterns. Zero excuses.',
  'The graph is waiting.',
  'Crack the pattern. Own the problem.',
  "You've been mapped. Proceed accordingly.",
]

const SIZE = 56
const CX = SIZE / 2
const CY = SIZE / 2
const IRIS_R = 24

type OrbitNode = { angle: number; speed: number; radius: number; color: string; size: number }

function buildOrbitNodes(): OrbitNode[] {
  return CATEGORIES.map((cat, i) => ({
    angle: (i / CATEGORIES.length) * Math.PI * 2,
    speed: (i % 2 === 0 ? 1 : -1) * (0.004 + (i % 3) * 0.002),
    radius: i < 4 ? 8 : i < 10 ? 13 : 17,
    color: cat.color,
    size: 1.8,
  }))
}

export function CartographerEye() {
  const irisRef    = useRef<HTMLCanvasElement>(null)
  const orbitRef   = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const mouse      = useRef({ x: 0.5, y: 0.5 })
  const pupil      = useRef({ x: 0, y: 0 })
  const hovered    = useRef(false)
  const absorbT    = useRef(0)
  const apertureT  = useRef(0)
  const ringAngles = useRef([0, 0, 0])
  const ringLocked = useRef(false)
  const nodes      = useRef<OrbitNode[]>(buildOrbitNodes())
  const rafId      = useRef(0)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const ic  = irisRef.current!
    const oc  = orbitRef.current!
    const ovr = overlayRef.current!
    const ictx  = ic.getContext('2d')!
    const octx  = oc.getContext('2d')!
    const ovctx = ovr.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    ;[ic, oc, ovr].forEach(c => {
      c.width  = SIZE * dpr; c.height = SIZE * dpr
      c.style.width = `${SIZE}px`; c.style.height = `${SIZE}px`
    })
    ;[ictx, octx, ovctx].forEach(ctx => ctx.setTransform(dpr, 0, 0, dpr, 0, 0))

    let irisRot = 0

    const drawIris = () => {
      ictx.clearRect(0, 0, SIZE, SIZE)
      const g = ictx.createRadialGradient(CX, CY, 0, CX, CY, IRIS_R)
      g.addColorStop(0,    '#e8f8ff')
      g.addColorStop(0.12, '#00D4FF')
      g.addColorStop(0.4,  '#005f7a')
      g.addColorStop(0.72, '#001a24')
      g.addColorStop(1,    '#000509')
      ictx.beginPath(); ictx.arc(CX, CY, IRIS_R, 0, Math.PI * 2)
      ictx.fillStyle = g; ictx.fill()
      ictx.save(); ictx.translate(CX, CY); ictx.rotate(irisRot)
      for (let i = 0; i < 18; i++) {
        ictx.save(); ictx.rotate((i / 18) * Math.PI * 2)
        ictx.globalAlpha = i % 2 === 0 ? 0.15 : 0.07
        ictx.strokeStyle = '#fff'; ictx.lineWidth = 0.6
        ictx.beginPath(); ictx.moveTo(0, 4); ictx.lineTo(0, IRIS_R - 2); ictx.stroke()
        ictx.restore()
      }
      ictx.restore()
      irisRot += 0.003
    }

    const drawOrbits = () => {
      octx.clearRect(0, 0, SIZE, SIZE)
      octx.save(); octx.beginPath(); octx.arc(CX, CY, IRIS_R, 0, Math.PI * 2); octx.clip()

      const absorb = absorbT.current

      const labels = 'ARR·STR·HMP·STK·QUE·LNK·TRE·REC·HEP·GRA·TRI·DP·GRD·BIT·SRT·RNG·'
      ;[10, 15, 20].forEach((r, ri) => {
        const dir   = ri % 2 === 0 ? 1 : -1
        const speed = [0.0008, 0.0012, 0.0006][ri]
        if (!ringLocked.current) {
          ringAngles.current[ri] += dir * speed
        }
        const angle  = ringAngles.current[ri]
        const chars  = Math.max(1, Math.floor(2 * Math.PI * r / 4))
        octx.save()
        octx.translate(CX, CY)
        octx.rotate(angle)
        octx.font = `${3.2 + ri * 0.2}px 'GeistMono', monospace`
        octx.textAlign = 'center'
        octx.textBaseline = 'middle'
        octx.globalAlpha = (1 - absorb) * (0.28 - ri * 0.06)
        octx.fillStyle = '#88bbcc'
        for (let i = 0; i < chars; i++) {
          const a = (i / chars) * Math.PI * 2
          const ch = labels[(i + ri * 5) % labels.length]
          octx.save()
          octx.rotate(a); octx.translate(0, -r); octx.rotate(-a - angle)
          octx.fillText(ch, 0, 0)
          octx.restore()
        }
        octx.restore()
      })

      nodes.current.forEach(n => {
        n.angle += n.speed * (1 - absorb)
        const r   = n.radius * (1 - absorb * 0.96)
        const nx  = CX + Math.cos(n.angle) * r
        const ny  = CY + Math.sin(n.angle) * r
        octx.beginPath(); octx.arc(nx, ny, n.size * (1 - absorb * 0.8), 0, Math.PI * 2)
        octx.fillStyle = n.color
        octx.globalAlpha = (1 - absorb * 0.9) * 0.85
        octx.fill()
      })

      octx.restore()
    }

    const drawOverlay = () => {
      ovctx.clearRect(0, 0, SIZE, SIZE)
      ovctx.save(); ovctx.beginPath(); ovctx.arc(CX, CY, IRIS_R, 0, Math.PI * 2); ovctx.clip()

      const mx = mouse.current.x, my = mouse.current.y
      const dx = mx - 0.5, dy = my - 0.5
      const a = Math.atan2(dy, dx)
      const s = Math.min(Math.sqrt(dx * dx + dy * dy) * 10, 5)
      pupil.current.x += (Math.cos(a) * s - pupil.current.x) * 0.14
      pupil.current.y += (Math.sin(a) * s - pupil.current.y) * 0.14
      const px = CX + pupil.current.x
      const py = CY + pupil.current.y

      const open = apertureT.current
      const PR = 5 + open * 2

      if (open > 0.1) {
        const g = ovctx.createRadialGradient(px, py, 0, px, py, PR * 2.5)
        g.addColorStop(0, `rgba(255,215,0,${open * 0.6})`)
        g.addColorStop(1, 'rgba(255,215,0,0)')
        ovctx.beginPath(); ovctx.arc(px, py, PR * 2.5, 0, Math.PI * 2)
        ovctx.fillStyle = g; ovctx.fill()
      }

      if (open < 0.8) {
        ovctx.beginPath(); ovctx.arc(px, py, PR * (1 - open * 0.5), 0, Math.PI * 2)
        ovctx.fillStyle = '#000009'; ovctx.fill()
        ovctx.beginPath(); ovctx.arc(px - 2, py - 2, 1.6, 0, Math.PI * 2)
        ovctx.fillStyle = `rgba(255,255,255,${0.85 - open * 0.5})`; ovctx.fill()
      }

      ovctx.save()
      ovctx.translate(px, py); ovctx.globalAlpha = 0.18 + open * 0.4
      ovctx.strokeStyle = '#FFD700'; ovctx.lineWidth = 0.5
      ;[0, Math.PI/4, Math.PI/2, 3*Math.PI/4].forEach(angle => {
        ovctx.beginPath()
        ovctx.moveTo(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5)
        ovctx.lineTo(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5)
        ovctx.stroke()
        ovctx.beginPath()
        ovctx.moveTo(Math.cos(angle + Math.PI) * 1.5, Math.sin(angle + Math.PI) * 1.5)
        ovctx.lineTo(Math.cos(angle + Math.PI) * 3.5, Math.sin(angle + Math.PI) * 3.5)
        ovctx.stroke()
      })
      ovctx.restore()

      ovctx.restore()

      ovctx.beginPath(); ovctx.arc(CX, CY, IRIS_R, 0, Math.PI * 2)
      ovctx.strokeStyle = `rgba(0,212,255,${0.2 + apertureT.current * 0.2})`
      ovctx.lineWidth = 0.6; ovctx.stroke()
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const frame = () => {
      const h = hovered.current
      absorbT.current  = lerp(absorbT.current,  h ? 1 : 0, h ? 0.09 : 0.06)
      apertureT.current = lerp(apertureT.current, h ? 1 : 0, h ? 0.07 : 0.05)
      if (h && absorbT.current > 0.95 && !ringLocked.current) ringLocked.current = true
      if (!h && apertureT.current < 0.05) ringLocked.current = false

      drawIris(); drawOrbits(); drawOverlay()
      rafId.current = requestAnimationFrame(frame)
    }

    rafId.current = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(rafId.current) }
  }, [])

  const handleClick = useCallback(() => {
    const text = WITTY[msgIdx % WITTY.length]
    setMsg(text); setMsgIdx(i => i + 1)
    setTimeout(() => setMsg(null), 3200)
  }, [msgIdx])

  return (
    <>
      <motion.div
        className="cursor-pointer select-none"
        onHoverStart={() => { hovered.current = true }}
        onHoverEnd={() => { hovered.current = false }}
        onClick={handleClick}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        style={{ position: 'relative', width: SIZE, height: SIZE }}
        aria-label="The Cartographer's Eye"
      >
        <canvas ref={irisRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <canvas ref={orbitRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <canvas ref={overlayRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />

        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          boxShadow: '0 0 0 1px rgba(255,215,0,0.18), 0 0 12px rgba(255,215,0,0.06)',
          pointerEvents: 'none',
        }} />
      </motion.div>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{
              position: 'fixed', top: '4rem', right: '1.25rem', zIndex: 9999,
              maxWidth: 260, borderRadius: 12,
              background: 'rgba(10,10,20,0.96)',
              border: '1px solid rgba(255,215,0,0.15)',
              padding: '10px 14px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
              {msg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
