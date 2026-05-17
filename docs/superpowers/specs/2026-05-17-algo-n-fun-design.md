# algo-n-fun — Design Spec

**Date:** 2026-05-17  
**Tagline:** *"Crack the pattern. Own the problem."*  
**Status:** Approved, ready for implementation

---

## Overview

`algo-n-fun` is a premium, static-frontend website that visualises 182 DSA patterns as an interactive 3D force graph. Users navigate the pattern hierarchy, discover curated problem sets for each pattern, and are redirected to their preferred coding platform (LeetCode, SPOJ, CodeChef, etc.) to solve. No backend. No submission engine. No infra cost.

The site is built as a spiritual successor to `web-internals` — same philosophy of making complex technical content gorgeous and explorable — but elevated to iOS-level premium UX with full 3D, a cryptex landing sequence, and a completely novel eye animation.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript 5 |
| UI Library | React 19 |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Animations | framer-motion + CSS (where GPU-safe) |
| Styling | Tailwind CSS v4 |
| Fonts | Geist Sans + Geist Mono |
| Hosting | Vercel (free tier) |
| Data | Static JSON/TS files — zero API calls |

---

## Visual Identity

### Color System

```css
/* Base */
--bg-void:     #03030A;   /* even deeper than koka-lab */
--bg-surface:  #0A0A14;
--bg-elevated: #10101E;
--bg-glass:    rgba(10, 10, 20, 0.72);

/* Text */
--text-primary: #F0F0FF;
--text-muted:   #4A4A6A;
--text-dim:     #2A2A3A;

/* Signature glow (brand) */
--glow-gold:  rgba(255, 215, 0, 0.12);
--glow-cyan:  rgba(0, 229, 255, 0.08);
--stroke:     rgba(255, 255, 255, 0.06);
```

### DSA Category Accents (16 categories)

| Category | Hex | Name |
|---|---|---|
| Array | `#00E5FF` | Cyan |
| String | `#4DFFB4` | Mint |
| Hash Map | `#FFD700` | Gold |
| Stack | `#FF6B6B` | Coral |
| Queue/Deque | `#A78BFA` | Violet |
| Linked List | `#60CFFF` | Sky |
| Trees | `#34D399` | Emerald |
| Recursion | `#FB923C` | Orange |
| Heap | `#F59E0B` | Amber |
| Graphs | `#818CF8` | Indigo |
| Trie | `#EC4899` | Pink |
| Dynamic Programming | `#6EE7B7` | Teal |
| Greedy | `#FCA5A5` | Rose |
| Bit Manipulation | `#22D3EE` | Light Cyan |
| Sorting Algorithms | `#CBD5E1` | Slate |
| Range Structures | `#7C3AED` | Deep Violet |

### Typography

- **Headings / UI:** Geist Sans (via `next/font/google`)
- **Code labels / node text:** Geist Mono
- **Film grain overlay:** Inherited from koka-lab — `opacity: 0.045`, `mix-blend-mode: overlay`, `animation: grainShift 8s steps(10) infinite`

---

## The Cartographer's Eye (Signature Animation)

A completely novel eye animation. Lives in the top-right corner of every page.

### Container
56×56px pill, `border-radius: 50%`, glass background (`--bg-glass`), subtle `box-shadow: 0 0 0 1px rgba(255,255,255,0.06)`.

### Layer Stack (bottom to top)
1. **Iris canvas** — rotating iris texture with radial gradient and 18 fiber lines (same base as web-internals `MouseEye`)
2. **Orbit canvas** — 16 colored mini-nodes (one per DSA category) in slow elliptical orbits around the pupil center
3. **Pupil + aperture SVG** — the aperture petals and pupil rendered in SVG for CSS-animatable transforms
4. **Overlay canvas** — mouse-tracked pupil highlight and sclera ring

### States

**Rest:**
- Iris slowly rotates (0.003 rad/frame)
- 16 colored dots orbit at varying speeds and radii (inner orbit: 4 nodes, outer: 12 nodes)
- Three concentric text rings in Geist Mono at ~3.5px, rotating at different speeds and directions, bearing: `ARR·STR·HMP·STK·QUE·LNK·TRE·REC·HEP·GRA·TRI·DP·GRD·BIT·SRT·RNG`
- Pupil: deep black with a sub-pixel golden compass-rose engraved at its center
- Mouse tracked: pupil lerps toward cursor position (same mechanic as koka-lab)

**Hover:**
1. Orbiting nodes rush toward the pupil center — absorbed (120ms, `cubic-bezier(0.55, 0, 1, 0.45)`)
2. Pupil irises open as 6-petal camera aperture (`clip-path` or SVG path animation, 200ms)
3. Inner aperture: golden point light pulses
4. Three text rings simultaneously snap to 0° — "combination lock click" (`transition: transform 80ms steps(1)`)
5. Breathing golden halo: `box-shadow` oscillation at 0.8s

**Mouse-leave:** Full reversal in reverse order. Aperture closes → nodes un-absorb → rings resume rotating.

**Click:**
- Particle burst: 32 colored particles eject radially (canvas `requestAnimationFrame`, 600ms lifetime, fade out)
- Witty message appears below the eye (framer-motion spring, 3.2s lifetime):
  - *"Pattern unlocked. Now go solve something."*
  - *"182 patterns. Zero excuses."*
  - *"The graph is waiting."*
  - *"Crack the pattern. Own the problem."*
  - *"You've been mapped. Proceed accordingly."*

### Implementation
- Three `<canvas>` elements stacked with `position: absolute`
- One `<svg>` overlay for the aperture petals (6 paths, CSS `transform-origin` at centre)
- All RAF loops run in a single `useEffect` — one cleanup function
- Mouse position from a shared `useMousePosition` hook (window-level, passive listener)

---

## 3D Graph + Cryptex Landing

### Asset
- GLB: `/public/models/da_vinci_code_cryptex.glb` (copied from `~/Downloads/`)
- Load via `useGLTF` with Draco compression if file is > 2MB

### Landing Sequence

1. **Load state:** Cryptex appears centred on the void. Warm gold point light (`#FFD700`, intensity 1.8) from above-right. Cool cyan rim light (`#00E5FF`, intensity 0.6) from below-left. Slow Y-rotation at 0.002 rad/frame.
2. **Unlock trigger:** After all assets loaded (or 2.5s, whichever first). The letter rings on the cryptex spin at 8× speed for 400ms, then snap to alignment. Camera does a micro-shake (`position.y += sin(t) * 0.003` for 300ms). Flash of white light (`MeshBasicMaterial` plane at opacity 0 → 0.6 → 0, 200ms).
3. **Dissolve:** Cryptex geometry fades out over 300ms while 182 particles emit from its surface, each coloured by its target DSA category.
4. **Graph formation:** Particles `lerp` toward their force-simulation target positions over 800ms with a spring easing. Graph settles and becomes interactive.

### 3D Force Graph

**Library:** Custom Three.js implementation using `d3-force-3d` for physics. Not `three-forcegraph` (too opinionated for this level of custom rendering).

**Node rendering:**
- `InstancedMesh` of `SphereGeometry(0.4, 16, 16)` — one draw call for all 182 nodes
- `MeshStandardMaterial` with `emissive` set to category color, `emissiveIntensity: 0.6`
- Leaf nodes: radius 0.28, `emissiveIntensity: 0.9`
- Post-processing: `UnrealBloomPass` (strength 0.8, radius 0.4, threshold 0.2) for the glow

**Edge rendering:**
- `LineSegments2` from Three.js addons for GPU-accelerated thick lines
- Color: parent node's category color at 40% opacity, fading to 20% at child
- Line width: 0.8px (world space)

**Interaction:**
- `@react-three/drei` `OrbitControls` — `enablePan: false`, `maxDistance: 80`, `minDistance: 10`
- Raycasting against node bounding spheres (not exact geometry — much faster)
- Hover: node scale lerps to 1.4×, tooltip appears in screen-space (HTML overlay, `useFrame` sync)
- Single click: camera `lerp` tween to node position + 12 units back (600ms, `easeInOutQuad`). Children explode outward. Floating badge `"Browse [N] patterns →"` appears.
- Badge click: `router.push('/pattern/[slug]')`
- Idle: 0.001 rad/frame Y-rotation. Paused on `pointerdown`, resumed after 4s of no interaction.

**Force simulation:**
- `d3-force-3d`: `forceManyBody` (strength –120), `forceLink` (distance 8, strength 0.4), `forceCenter(0,0,0)`, `forceZ` (strength 0.1 — keeps graph roughly planar but with Z variation)
- Category nodes get a `forceCollide` radius of 12 to cluster sub-patterns near their parent

---

## Routing Architecture

```
app/
├── layout.tsx                           # Root: canvas + grain + MouseEye (always mounted)
├── page.tsx                             # Home: mounts graph, triggers landing sequence
│
├── @overlay/                            # Parallel route slot
│   ├── default.tsx                      # null (no overlay at home)
│   ├── (.)pattern/[slug]/               # Intercepting route
│   │   └── page.tsx                     # PatternPanel (slide-in over canvas)
│   └── (.)pattern/[slug]/[question]/    # Intercepting route
│       └── page.tsx                     # QuestionPanel (slide-in over canvas)
│
└── pattern/
    ├── [slug]/
    │   └── page.tsx                     # Direct URL → full listing page (SEO)
    └── [slug]/[question]/
        └── page.tsx                     # Direct URL → full question page (SEO)
```

**Interception behaviour:**
- Internal navigation (user clicked a node) → intercepting route fires → overlay panel mounts via `AnimatePresence`
- Direct URL visit (shared link, bookmark) → standard route renders — no graph, full-page layout
- Back button → exit animation on panel → canvas re-exposed

**Panel behaviour:**
- Desktop: 40vw width, slides from right, `backdrop-filter: blur(16px)` on canvas behind
- Mobile: full-screen sheet, drag handle at top, `pointer-events` swipe-to-dismiss (no library)
- `framer-motion` variants: `{ x: "100%" }` → `{ x: 0 }` with `spring(stiffness: 320, damping: 32)`

---

## Data Architecture

```
src/data/
├── patterns.ts    # 182 PatternNode records
├── problems.ts    # curated problems (30–50 to start)
└── categories.ts  # 16 DSACategory definitions with colors
```

```typescript
// categories.ts
export interface DSACategory {
  id: string          // 'array'
  label: string       // 'Array'
  color: string       // '#00E5FF'
  depth: 1
}

// patterns.ts
export interface PatternNode {
  id: string          // 'sliding-window--variable-size'
  label: string       // 'Variable Size'
  category: string    // DSACategory.id
  depth: number       // 0=root 1=category 2=pattern 3=sub 4=leaf
  parentId: string | null
  childIds: string[]
  isLeaf: boolean     // true = has problems attached
  color: string       // hex
}

// problems.ts
export interface Problem {
  id: string
  patternId: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  platform: 'LeetCode' | 'CodeChef' | 'SPOJ' | 'HackerRank' | 'GFG'
  url: string
  slug: string
  whyThisPattern: string
  tags: string[]
}
```

All data is statically imported — Next.js tree-shakes unused records. Zero runtime cost.

---

## Component Architecture

```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home
│   ├── @overlay/                # Parallel route
│   └── pattern/                 # Direct routes
│
├── components/
│   ├── CartographerEye.tsx      # The signature eye animation
│   ├── TopNav.tsx               # Navigation bar
│   ├── GrainOverlay.tsx         # Film grain (extracted from koka-lab)
│   │
│   ├── graph/
│   │   ├── GraphCanvas.tsx      # Three.js canvas wrapper (persistent)
│   │   ├── GraphScene.tsx       # Scene contents: lights, fog, controls
│   │   ├── NodeMesh.tsx         # InstancedMesh for all 182 nodes
│   │   ├── EdgeLines.tsx        # LineSegments2 for edges
│   │   ├── CryptexModel.tsx     # GLB loader + landing animation
│   │   ├── ForceSimulation.ts   # d3-force-3d wrapper (non-React)
│   │   └── useGraphInteraction.ts # Raycasting, click, hover state
│   │
│   ├── overlay/
│   │   ├── PatternPanel.tsx     # Slide-in pattern listing
│   │   └── QuestionPanel.tsx    # Slide-in question detail
│   │
│   └── ui/
│       ├── DifficultyBadge.tsx
│       ├── PlatformBadge.tsx
│       ├── ProblemCard.tsx
│       └── Breadcrumb.tsx
│
├── data/
│   ├── patterns.ts
│   ├── problems.ts
│   └── categories.ts
│
├── hooks/
│   ├── useMousePosition.ts     # Global mouse tracking (passive)
│   ├── useGraphStore.ts        # Store: { focusedNodeId: string|null, cameraTarget: Vector3, isAnimating: boolean }
│   └── useIdleReset.ts         # Idle detection for auto-rotation
│
└── lib/
    ├── graphLayout.ts          # Build adjacency list + initial positions from PatternNode[]
    └── colors.ts               # Category → hex lookup
```

---

## Page Designs

### TopNav (all pages)
- Left: `algo-n-fun` wordmark + tiny cryptex-dial SVG icon (animates on hover)
- Right: CartographerEye + pattern count chip + "Back to graph" link (sub-pages only)
- Glass background: `rgba(3,3,10,0.88)`, `backdrop-filter: blur(20px)`
- Border-bottom: `1px solid rgba(255,255,255,0.05)`

### Pattern Listing Page (`/pattern/[slug]`)
- TopNav with category accent colour bleeding into the page header
- Breadcrumb: `DSA Patterns → [Category]`
- Hero: category name + colour gradient header + `[N] patterns` badge
- Problem cards: 2-col grid (desktop), 1-col (mobile)
  - Title, difficulty pill, platform badge, "why this pattern" muted line, `Open on [Platform] →` ghost button

### Question Page (`/pattern/[slug]/[question]`)
- Full-bleed hero: problem title, difficulty, platform
- "Why this pattern" section with the hierarchy path
- Primary CTA: `Solve on [Platform] ↗` (coloured button)
- Related patterns: 3 sibling node cards
- Breadcrumb back

### Overlay Panels (intercepting routes)
- Same content as the full pages above
- Rendered in the `@overlay` slot
- Motion: spring slide-in from right
- Close: X button (top-right) or backdrop click or browser back

---

## Performance Constraints

| Concern | Mitigation |
|---|---|
| 182 nodes × draw calls | `InstancedMesh` — 1 draw call |
| Bloom post-processing | `UnrealBloomPass` only on the graph canvas, not the full page |
| GLB load time | Draco compression, `useGLTF` preload in `layout.tsx` |
| Eye animation RAF | Single RAF loop for all eye canvases; paused when element not in viewport (`IntersectionObserver`) |
| Force simulation | Runs on first mount, result cached in module scope; not re-run on re-renders |
| Font loading | `next/font` with `display: swap` |
| Route transitions | No canvas teardown — `@overlay` parallel route keeps canvas alive |

---

## What This Is NOT

- No code editor, no submission, no judge
- No backend, no database, no auth
- No problem content copied — only titles, difficulty, and links to the source platform
- No mock data — all problems link to real URLs

---

## Open Questions at Implementation Time

1. **Zustand vs React context** for graph store — Zustand preferred if store grows beyond 3 fields.
2. **Draco decoder** — bundle vs CDN. Prefer CDN (`@react-three/drei` CDN default) to avoid bundle bloat.
3. **Problem data seeding** — 30 problems at launch: minimum 1 per category (16), remainder filling the highest-traffic patterns (Sliding Window, Two Pointer, BFS/DFS, Binary Search, DP Tabulation). Add more via JSON PR workflow.
4. **Mobile 3D performance** — if `WebGL2` not available, fallback to a 2D SVG graph (radial tree layout).
