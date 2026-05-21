'use client'
import { useProgress } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'

export function HeroLoader() {
  const { progress, active } = useProgress()
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active && progress >= 100 && visible) {
      let op = 1
      const fade = () => {
        op -= 0.04
        setOpacity(Math.max(0, op))
        if (op > 0) rafRef.current = requestAnimationFrame(fade)
        else setVisible(false)
      }
      rafRef.current = requestAnimationFrame(fade)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, progress, visible])

  if (!visible) return null

  const pct = Math.round(progress)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity,
      }}
    >
      {/* Concentric watch-ring loader — single white palette */}
      <div style={{ position: 'relative', width: 52, height: 52, marginBottom: 24 }}>

        {/* Outer ring — slow, dim */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(240,240,255,0.12)',
          borderTopColor: 'rgba(240,240,255,0.60)',
          animation: 'loaderSpin 2s linear infinite',
        }} />

        {/* Inner ring — faster, slightly brighter */}
        <div style={{
          position: 'absolute', inset: 9,
          borderRadius: '50%',
          border: '1px solid rgba(240,240,255,0.08)',
          borderTopColor: 'rgba(240,240,255,0.38)',
          animation: 'loaderSpin 1.2s linear infinite reverse',
        }} />

        {/* Centre dot — only gold accent */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 4, height: 4,
          borderRadius: '50%',
          background: 'rgba(255,210,80,0.9)',
        }} />
      </div>

      {/* Progress bar — hairline */}
      <div style={{
        width: 96,
        height: 1,
        background: 'rgba(255,255,255,0.07)',
        marginBottom: 10,
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'rgba(240,240,255,0.50)',
          transition: 'width 0.1s linear',
        }} />
      </div>

      {/* Label */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        letterSpacing: '0.20em',
        color: 'rgba(255,255,255,0.22)',
        textTransform: 'uppercase',
      }}>
        {pct < 100 ? `${pct}%` : 'ready'}
      </span>

      <style>{`
        @keyframes loaderSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
