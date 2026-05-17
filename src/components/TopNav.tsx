// src/components/TopNav.tsx
'use client'
import Link from 'next/link'

export function TopNav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 sm:px-8"
      style={{
        background: 'rgba(3,3,10,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <Link href="/" className="flex items-center gap-2.5 group" aria-label="algo-n-fun home">
        {/* Cryptex dial icon */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="9" stroke="#FFD700" strokeWidth="1" strokeOpacity="0.6" />
          <circle cx="11" cy="11" r="5" stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.35" />
          <circle cx="11" cy="11" r="1.5" fill="#FFD700" fillOpacity="0.8" />
          {[0,60,120,180,240,300].map(deg => {
            const r = deg * Math.PI / 180
            return <line key={deg} x1={11+9*Math.sin(r)} y1={11-9*Math.cos(r)}
              x2={11+5*Math.sin(r)} y2={11-5*Math.cos(r)}
              stroke="#FFD700" strokeWidth="0.8" strokeOpacity="0.4" />
          })}
        </svg>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--text-primary)',
          opacity: 0.9,
        }}>
          algo<span style={{ color: '#FFD700', opacity: 0.8 }}>-n-</span>fun
        </span>
      </Link>

      {/* Eye placeholder — replaced in Task 5 */}
      <div id="eye-slot" />
    </header>
  )
}
