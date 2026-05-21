// src/components/CartographerEye.tsx
'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Witty whispers ───────────────────────────────────────────────────────────
const WITTY = [
  'Pattern unlocked. Now go solve something.',
  '182 patterns. Zero excuses.',
  'The graph is waiting.',
  'Crack the pattern. Own the problem.',
  "You've been mapped. Proceed accordingly.",
]

// ─── Geometry ────────────────────────────────────────────────────────────────
const SIZE   = 56
const CX     = SIZE / 2
const CY     = SIZE / 2
const IRIS_R = 23
const RIM_R  = IRIS_R + 2.2

// ─── Single chromatic palette ────────────────────────────────────────────────
//
// Deliberately constrained: the iris is a deep-teal void, the filaments are
// icy cyan, the rim & accents are warm gold. Three families, nothing else.
// (The old eye crammed all 16 category colors inside a 56-pixel disc — that
// reads as confetti, not a watchful instrument.)
//
const C = {
  void:     '#020610',
  irisDeep: '#04202f',
  irisMid:  '#0e4d6a',
  irisHi:   '#3fb6d8',
  filament: '#a8e6ff',
  accent:   '#f5cf7a',
  gold:     '#d4a85a',
  goldDim:  'rgba(212,168,90,0.32)',
} as const

// ─── Component ────────────────────────────────────────────────────────────────
export function CartographerEye() {
  const irisRef    = useRef<HTMLCanvasElement>(null)
  const orbitRef   = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)

  // Mouse state — clamped & normalized (-1..1 relative to viewport centre).
  const mouse   = useRef({ x: 0, y: 0, dist: 0, angle: 0 })
  const pupil   = useRef({ x: 0, y: 0 })
  const hovered = useRef(false)
  const dilate  = useRef(0)          // 0..1, smoothed hover state
  const scan    = useRef(0)          // 0..1, scan line phase
  const blink   = useRef(0)          // 0..1, occasional involuntary blink
  const tRef    = useRef(0)
  const rafId   = useRef(0)
  const [msg, setMsg]       = useState<string | null>(null)
  const [msgIdx, setMsgIdx] = useState(0)

  // ── Mouse tracking ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Normalise -1..1 across the larger axis so we don't get squashed
      // tracking on ultrawide displays.
      const w  = window.innerWidth
      const h  = window.innerHeight
      const nx = (e.clientX / w - 0.5) * 2
      const ny = (e.clientY / h - 0.5) * 2
      mouse.current.x     = nx
      mouse.current.y     = ny
      mouse.current.dist  = Math.min(1, Math.sqrt(nx * nx + ny * ny))
      mouse.current.angle = Math.atan2(ny, nx)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ic  = irisRef.current!
    const oc  = orbitRef.current!
    const ovr = overlayRef.current!
    const ictx  = ic.getContext('2d')!
    const octx  = oc.getContext('2d')!
    const ovctx = ovr.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    ;[ic, oc, ovr].forEach(c => {
      c.width  = SIZE * dpr
      c.height = SIZE * dpr
      c.style.width  = `${SIZE}px`
      c.style.height = `${SIZE}px`
    })
    ;[ictx, octx, ovctx].forEach(ctx => ctx.setTransform(dpr, 0, 0, dpr, 0, 0))

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const TAU  = Math.PI * 2

    // ── Layer 1: Iris well — deep gradient + animated filaments ───────────
    //
    // The iris is the soul of the eye. It's a void you fall into. A radial
    // gradient gives the impression of depth; on top of that, 36 thin radial
    // filaments breathe with a sine wave (ripples on dark water). On hover,
    // filaments lean toward the cursor angle — the eye is *looking*.
    //
    const drawIris = () => {
      ictx.clearRect(0, 0, SIZE, SIZE)

      // — Deep iris gradient (the well)
      const g = ictx.createRadialGradient(CX, CY, 0, CX, CY, IRIS_R)
      g.addColorStop(0,    C.irisHi)
      g.addColorStop(0.12, C.irisMid)
      g.addColorStop(0.55, C.irisDeep)
      g.addColorStop(1,    C.void)
      ictx.beginPath(); ictx.arc(CX, CY, IRIS_R, 0, TAU)
      ictx.fillStyle = g; ictx.fill()

      // — Concentric texture rings (very subtle, like growth rings)
      ictx.save()
      for (let i = 0; i < 4; i++) {
        const r = IRIS_R * (0.34 + i * 0.18)
        ictx.beginPath(); ictx.arc(CX, CY, r, 0, TAU)
        ictx.strokeStyle = `rgba(168,230,255,${0.04 + i * 0.015})`
        ictx.lineWidth = 0.4
        ictx.stroke()
      }
      ictx.restore()

      // — Radial filaments. Opacity rides a sine wave; on hover, intensity
      //   bias shifts toward the cursor angle so the iris *leans*.
      const N      = 36
      const t      = tRef.current
      const lean   = mouse.current.angle    // -π..π
      const leanW  = dilate.current         // hover weight
      ictx.save(); ictx.translate(CX, CY)
      for (let i = 0; i < N; i++) {
        const a    = (i / N) * TAU
        // Distance of this filament's angle from the lean direction
        let da     = a - lean
        while (da >  Math.PI) da -= TAU
        while (da < -Math.PI) da += TAU
        const bias = Math.cos(da)              // -1..1, 1 = aligned with mouse
        const wave = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.42)
        const alpha =
          0.10 +                               // base presence
          wave * 0.16 +                        // breathing ripple
          leanW * (Math.max(0, bias) ** 2) * 0.55  // hover lean

        ictx.save()
        ictx.rotate(a)
        ictx.globalAlpha = alpha
        const grad = ictx.createLinearGradient(0, 5, 0, IRIS_R - 1)
        grad.addColorStop(0, 'rgba(168,230,255,0)')
        grad.addColorStop(0.6, C.filament)
        grad.addColorStop(1, 'rgba(245,207,122,0.7)')
        ictx.strokeStyle = grad
        ictx.lineWidth = 0.5 + leanW * 0.4
        ictx.beginPath()
        ictx.moveTo(0, 5)
        ictx.lineTo(0, IRIS_R - 1)
        ictx.stroke()
        ictx.restore()
      }
      ictx.restore()
    }

    // ── Layer 2: Constellation + rim — slow rotators that earn the
    //              "Cartographer" name. ──────────────────────────────────────
    //
    // - 12 constellation dots arranged in a circle, rotating slowly. On hover
    //   they morph into a sacred-geometry hexagram pattern.
    // - A pair of tiny compass tick clusters on the rim, also rotating, with
    //   a small notch that aligns to the cursor direction (the eye becomes
    //   a compass, pointing at you).
    //
    const drawOrbits = () => {
      octx.clearRect(0, 0, SIZE, SIZE)
      const t = tRef.current

      // ── Inner clip — constellation only lives inside the iris ─────────
      octx.save()
      octx.beginPath(); octx.arc(CX, CY, IRIS_R - 1, 0, TAU); octx.clip()

      // Constellation dots
      const CN     = 12
      const baseR  = IRIS_R * 0.62
      const rot    = t * 0.18
      const morph  = dilate.current         // 0..1, drives the hexagram morph
      octx.save(); octx.translate(CX, CY); octx.rotate(rot)
      for (let i = 0; i < CN; i++) {
        const a = (i / CN) * TAU
        // Idle: even circle. Hover: every other dot pulls inward → hexagram.
        const pull = (i % 2 === 0) ? 0 : -baseR * 0.35
        const r    = baseR + pull * morph
        const x    = Math.cos(a) * r
        const y    = Math.sin(a) * r
        const twinkle = 0.6 + 0.4 * Math.sin(t * 2.2 + i * 0.9)
        octx.globalAlpha = (0.35 + morph * 0.5) * twinkle
        octx.fillStyle = i % 3 === 0 ? C.accent : C.filament
        octx.beginPath()
        octx.arc(x, y, 0.85 + morph * 0.3, 0, TAU)
        octx.fill()
      }

      // Hexagram connectors — appear smoothly on hover
      if (morph > 0.05) {
        octx.globalAlpha = morph * 0.4
        octx.strokeStyle = C.accent
        octx.lineWidth = 0.5
        // Connect every fourth dot (i, i+4, i+8 → two triangles = hexagram)
        for (let tri = 0; tri < 2; tri++) {
          octx.beginPath()
          for (let k = 0; k <= 3; k++) {
            const i = (tri + (k % 3) * 4) % CN
            const a = (i / CN) * TAU
            const r = baseR
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (k === 0) octx.moveTo(x, y); else octx.lineTo(x, y)
          }
          octx.stroke()
        }
      }
      octx.restore()

      // ── Scan line — horizontal beam sweeping inside the iris ──────────
      // Idle: a slow occasional pass. Hover: continuous, brighter.
      const scanY  = (-IRIS_R) + scan.current * (IRIS_R * 2)
      const scanA  = (Math.sin(scan.current * Math.PI)) * (0.18 + dilate.current * 0.42)
      const scanG  = octx.createLinearGradient(0, scanY - 4, 0, scanY + 4)
      scanG.addColorStop(0,   'rgba(168,230,255,0)')
      scanG.addColorStop(0.5, `rgba(168,230,255,${scanA})`)
      scanG.addColorStop(1,   'rgba(168,230,255,0)')
      octx.fillStyle = scanG
      octx.fillRect(CX - IRIS_R, CY + scanY - 4, IRIS_R * 2, 8)

      octx.restore()  // end iris clip

      // ── Rim ornaments — compass ticks + cursor notch ─────────────────────
      const tickN   = 36
      const rimRot  = t * 0.05
      octx.save(); octx.translate(CX, CY); octx.rotate(rimRot)
      for (let i = 0; i < tickN; i++) {
        const a   = (i / tickN) * TAU
        const big = i % 9 === 0
        octx.save()
        octx.rotate(a)
        octx.globalAlpha = big ? 0.5 : 0.18 + dilate.current * 0.15
        octx.strokeStyle = big ? C.gold : C.goldDim
        octx.lineWidth = big ? 0.8 : 0.4
        octx.beginPath()
        octx.moveTo(0, -RIM_R)
        octx.lineTo(0, -RIM_R - (big ? 2.0 : 1.0))
        octx.stroke()
        octx.restore()
      }
      octx.restore()

      // Cursor notch — a tiny gold pip on the rim pointing at the mouse.
      // This is the "the eye knows where you are" tell.
      const notchA  = mouse.current.angle
      const notchD  = Math.max(0.18, mouse.current.dist) * 0.85
      octx.save()
      octx.translate(CX + Math.cos(notchA) * RIM_R, CY + Math.sin(notchA) * RIM_R)
      octx.rotate(notchA + Math.PI / 2)
      octx.fillStyle = C.accent
      octx.globalAlpha = 0.65 + dilate.current * 0.3
      octx.beginPath()
      octx.moveTo(0, -2.4)
      octx.lineTo(1.6, 1.4)
      octx.lineTo(-1.6, 1.4)
      octx.closePath()
      octx.fill()
      // Faint reach line toward cursor distance
      octx.globalAlpha = 0.18 + dilate.current * 0.25
      octx.strokeStyle = C.accent
      octx.lineWidth = 0.5
      octx.beginPath()
      octx.moveTo(0, -3)
      octx.lineTo(0, -3 - notchD * 4)
      octx.stroke()
      octx.restore()
    }

    // ── Layer 3: Pupil + galaxy core + blink overlay ──────────────────────
    //
    // Pupil tracks the cursor with smooth parallax. On hover the pupil
    // dilates, a gold limbus ring appears, and the core becomes a tiny
    // three-ring galaxy (counter-rotating).
    //
    const drawOverlay = () => {
      ovctx.clearRect(0, 0, SIZE, SIZE)
      ovctx.save(); ovctx.beginPath(); ovctx.arc(CX, CY, IRIS_R, 0, TAU); ovctx.clip()

      // Pupil parallax — tracks mouse, clamped well inside the iris
      const MAX_OFFSET = IRIS_R * 0.30
      const tx = mouse.current.x * MAX_OFFSET
      const ty = mouse.current.y * MAX_OFFSET
      pupil.current.x = lerp(pupil.current.x, tx, 0.12)
      pupil.current.y = lerp(pupil.current.y, ty, 0.12)
      const px = CX + pupil.current.x
      const py = CY + pupil.current.y

      // Pupil radius — dilates on hover, contracts on blink
      const baseR    = IRIS_R * 0.30
      const dilateR  = baseR + dilate.current * (IRIS_R * 0.10)
      const PR       = dilateR * (1 - blink.current * 0.55)

      // Gold limbus ring (the inner edge of the iris glows on hover)
      if (dilate.current > 0.05) {
        ovctx.save()
        ovctx.globalAlpha = dilate.current * 0.55
        ovctx.strokeStyle = C.accent
        ovctx.lineWidth = 0.7
        ovctx.beginPath(); ovctx.arc(CX, CY, IRIS_R - 1.5, 0, TAU); ovctx.stroke()
        ovctx.restore()
      }

      // Pupil core — deep void
      ovctx.beginPath(); ovctx.arc(px, py, PR, 0, TAU)
      ovctx.fillStyle = C.void
      ovctx.fill()

      // Inner glow halo (sits *inside* the pupil — like staring into a portal)
      const halo = ovctx.createRadialGradient(px, py, 0, px, py, PR)
      halo.addColorStop(0,   `rgba(168,230,255,${0.7 + dilate.current * 0.25})`)
      halo.addColorStop(0.4, `rgba(168,230,255,${0.18})`)
      halo.addColorStop(1,   'rgba(168,230,255,0)')
      ovctx.beginPath(); ovctx.arc(px, py, PR, 0, TAU)
      ovctx.fillStyle = halo; ovctx.fill()

      // Bright cyan core
      const coreR = PR * 0.22
      ovctx.beginPath(); ovctx.arc(px, py, coreR, 0, TAU)
      ovctx.fillStyle = C.filament
      ovctx.globalAlpha = 0.95
      ovctx.fill()
      ovctx.globalAlpha = 1

      // Galaxy rings inside the pupil on hover — counter-rotating ellipses
      if (dilate.current > 0.15) {
        const t = tRef.current
        ovctx.save(); ovctx.translate(px, py)
        const ringSpecs = [
          { r: PR * 0.55, rot:  t * 1.8,  squash: 0.34, color: C.accent,   alpha: 0.55 },
          { r: PR * 0.78, rot: -t * 1.2,  squash: 0.22, color: C.filament, alpha: 0.40 },
          { r: PR * 0.92, rot:  t * 0.75, squash: 0.14, color: C.gold,     alpha: 0.30 },
        ]
        ringSpecs.forEach(rs => {
          ovctx.save()
          ovctx.rotate(rs.rot)
          ovctx.scale(1, rs.squash)
          ovctx.globalAlpha = rs.alpha * dilate.current
          ovctx.strokeStyle = rs.color
          ovctx.lineWidth = 0.6
          ovctx.beginPath(); ovctx.arc(0, 0, rs.r, 0, TAU); ovctx.stroke()
          // A tiny travelling jewel on the orbit
          ovctx.fillStyle = rs.color
          ovctx.globalAlpha = rs.alpha * dilate.current * 1.6
          ovctx.beginPath(); ovctx.arc(rs.r, 0, 0.55, 0, TAU); ovctx.fill()
          ovctx.restore()
        })
        ovctx.restore()
      }

      // Specular highlight — top-left, classic eye catchlight
      ovctx.beginPath()
      ovctx.arc(px - PR * 0.45, py - PR * 0.45, PR * 0.18, 0, TAU)
      ovctx.fillStyle = `rgba(255,255,255,${0.55 - dilate.current * 0.2})`
      ovctx.fill()

      ovctx.restore()  // end iris clip

      // ── Blink shutter — two horizontal bands closing in from top & bottom
      if (blink.current > 0.01) {
        const close = blink.current * (IRIS_R + 2)
        ovctx.fillStyle = '#000308'
        ovctx.fillRect(CX - IRIS_R - 2, CY - IRIS_R - 2, IRIS_R * 2 + 4, close)
        ovctx.fillRect(CX - IRIS_R - 2, CY + IRIS_R + 2 - close, IRIS_R * 2 + 4, close)
      }

      // ── Outer hairline ring — gold on idle, brighter on hover ───────
      ovctx.beginPath(); ovctx.arc(CX, CY, IRIS_R, 0, TAU)
      ovctx.strokeStyle = dilate.current > 0.1
        ? `rgba(245,207,122,${0.35 + dilate.current * 0.4})`
        : 'rgba(212,168,90,0.25)'
      ovctx.lineWidth = 0.7
      ovctx.stroke()
    }

    // ── Main frame ─────────────────────────────────────────────────────────
    let lastBlink = performance.now()
    const frame = (now: number) => {
      const dt = 1 / 60
      tRef.current += dt

      // Smoothed hover
      const target = hovered.current ? 1 : 0
      dilate.current = lerp(dilate.current, target, hovered.current ? 0.10 : 0.06)

      // Scan line — slow idle drift, fast continuous on hover.
      // We let the value go past 1 then snap to 0 so we get a fresh sweep.
      const scanSpeed = 0.0028 + dilate.current * 0.012
      scan.current   += scanSpeed
      if (scan.current >= 1) scan.current = 0

      // Involuntary blink — every 6..11s, ~140ms event
      if (now - lastBlink > 6000 + Math.random() * 5000) {
        lastBlink = now
        // Trigger a half-second blink cycle
        const start = now
        const blinkDur = 140
        const animBlink = (ts: number) => {
          const k = Math.min(1, (ts - start) / blinkDur)
          // 0 → 1 → 0 across the duration
          blink.current = Math.sin(k * Math.PI)
          if (k < 1) requestAnimationFrame(animBlink)
          else blink.current = 0
        }
        requestAnimationFrame(animBlink)
      }

      drawIris()
      drawOrbits()
      drawOverlay()

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
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        style={{ position: 'relative', width: SIZE, height: SIZE }}
        aria-label="The Cartographer's Eye"
      >
        <canvas ref={irisRef}    width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <canvas ref={orbitRef}   width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <canvas ref={overlayRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />

        {/* Outer halo — sits underneath, gold breathing glow */}
        <div style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          boxShadow: '0 0 0 1px rgba(245,207,122,0.18), 0 0 14px rgba(245,207,122,0.10), inset 0 0 8px rgba(0,0,0,0.7)',
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
              border: '1px solid rgba(245,207,122,0.18)',
              padding: '10px 14px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p style={{
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              fontFamily: 'var(--font-mono)',
            }}>
              {msg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
