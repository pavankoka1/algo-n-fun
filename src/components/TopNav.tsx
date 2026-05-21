// src/components/TopNav.tsx
'use client'
import { CartographerEye } from './CartographerEye'

// Slim, transparent header used by inner pages only. The logo & wordmark
// were removed — the page is the brand. Only the navigation eye remains
// on the right, floating against whatever the page's hero is.
export function TopNav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-end px-5 sm:px-8"
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <CartographerEye />
      </div>
    </header>
  )
}
