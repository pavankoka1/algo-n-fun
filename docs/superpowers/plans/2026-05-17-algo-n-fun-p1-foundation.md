# algo-n-fun — Phase 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Next.js project, install all dependencies, build the design system, data layer, CartographerEye animation, and TopNav — producing a running shell at `http://localhost:3000` with the eye, grain overlay, and nav working.

**Architecture:** Next.js 15 App Router in `/Users/pavankurmarao.k/Documents/personal/algo-n-fun`. Root layout mounts the grain overlay and TopNav on every page. CartographerEye is a canvas-based animation in the nav. Static data files define all 182 DSA pattern nodes and 30 curated problems. No backend.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, Geist font, framer-motion 12, Three.js 0.175, @react-three/fiber 9, @react-three/drei 10

---

### Task 1: Scaffold the project

**Files:**
- Create: `/Users/pavankurmarao.k/Documents/personal/algo-n-fun/` (entire project)

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/pavankurmarao.k/Documents/personal
npx create-next-app@latest algo-n-fun \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-turbopack \
  --import-alias "@/*"
```

- [ ] **Step 2: Install all dependencies**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
npm install three@0.175.0 @react-three/fiber@9.0.0 @react-three/drei@10.0.6 \
  @react-three/postprocessing \
  framer-motion@12 \
  d3-force-3d \
  zustand \
  geist
npm install --save-dev @types/three@0.175.0 @gltf-transform/cli @gltf-transform/extensions
```

- [ ] **Step 3: Copy the cryptex GLB**

```bash
mkdir -p /Users/pavankurmarao.k/Documents/personal/algo-n-fun/public/models
cp /Users/pavankurmarao.k/Downloads/da_vinci_code_cryptex.glb \
   /Users/pavankurmarao.k/Documents/personal/algo-n-fun/public/models/
ls -lh /Users/pavankurmarao.k/Documents/personal/algo-n-fun/public/models/
```

Expected: file visible, size reasonable (< 30MB).

- [ ] **Step 4: Update next.config.ts**

Replace contents of `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { typedRoutes: true },
  webpack(cfg) {
    cfg.module.rules.push({ test: /\.(glb|gltf)$/, type: 'asset/resource' })
    return cfg
  },
}

export default config
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev &
sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

Kill dev server after: `pkill -f "next dev"`

- [ ] **Step 6: Init git**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git init && git add -A
git commit -m "chore: scaffold algo-n-fun"
```

---

### Task 2: Design system — globals.css and CSS variables

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css entirely**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}

:root {
  /* Base */
  --bg-void:     #03030A;
  --bg-surface:  #0A0A14;
  --bg-elevated: #10101E;
  --bg-glass:    rgba(10, 10, 20, 0.72);

  /* Text */
  --text-primary: #F0F0FF;
  --text-muted:   #4A4A6A;
  --text-dim:     #2A2A3A;

  /* Brand glows */
  --glow-gold:  rgba(255, 215, 0, 0.14);
  --glow-cyan:  rgba(0, 229, 255, 0.08);
  --stroke:     rgba(255, 255, 255, 0.06);

  /* Category accents */
  --cat-array:        #00E5FF;
  --cat-string:       #4DFFB4;
  --cat-hashmap:      #FFD700;
  --cat-stack:        #FF6B6B;
  --cat-queue:        #A78BFA;
  --cat-linkedlist:   #60CFFF;
  --cat-trees:        #34D399;
  --cat-recursion:    #FB923C;
  --cat-heap:         #F59E0B;
  --cat-graphs:       #818CF8;
  --cat-trie:         #EC4899;
  --cat-dp:           #6EE7B7;
  --cat-greedy:       #FCA5A5;
  --cat-bitmanip:     #22D3EE;
  --cat-sorting:      #CBD5E1;
  --cat-range:        #7C3AED;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg-void);
  color: var(--text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background: rgba(0, 229, 255, 0.18);
  color: #fff;
}

/* Film grain */
.grain {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9000;
  opacity: 0.042;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grainShift 8s steps(10) infinite;
}

@keyframes grainShift {
  0%,100% { transform: translate(0,0); }
  25%      { transform: translate(-2%,2%); }
  50%      { transform: translate(2%,-1%); }
  75%      { transform: translate(-1%,-2%); }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/app/globals.css
git commit -m "feat: add design system CSS variables and grain animation"
```

---

### Task 3: Data layer — categories, patterns, problems

**Files:**
- Create: `src/data/categories.ts`
- Create: `src/data/patterns.ts`
- Create: `src/data/problems.ts`
- Create: `src/lib/colors.ts`

- [ ] **Step 1: Create src/data/categories.ts**

```typescript
// src/data/categories.ts
export type CategoryId =
  | 'array' | 'string' | 'hashmap' | 'stack' | 'queue'
  | 'linkedlist' | 'trees' | 'recursion' | 'heap' | 'graphs'
  | 'trie' | 'dp' | 'greedy' | 'bitmanip' | 'sorting' | 'range'

export interface DSACategory {
  id: CategoryId
  label: string
  color: string
}

export const CATEGORIES: DSACategory[] = [
  { id: 'array',      label: 'Array',              color: '#00E5FF' },
  { id: 'string',     label: 'String',             color: '#4DFFB4' },
  { id: 'hashmap',    label: 'Hash Map',            color: '#FFD700' },
  { id: 'stack',      label: 'Stack',              color: '#FF6B6B' },
  { id: 'queue',      label: 'Queue / Deque',      color: '#A78BFA' },
  { id: 'linkedlist', label: 'Linked List',        color: '#60CFFF' },
  { id: 'trees',      label: 'Trees',              color: '#34D399' },
  { id: 'recursion',  label: 'Recursion',          color: '#FB923C' },
  { id: 'heap',       label: 'Heap',               color: '#F59E0B' },
  { id: 'graphs',     label: 'Graphs',             color: '#818CF8' },
  { id: 'trie',       label: 'Trie',               color: '#EC4899' },
  { id: 'dp',         label: 'Dynamic Programming', color: '#6EE7B7' },
  { id: 'greedy',     label: 'Greedy',             color: '#FCA5A5' },
  { id: 'bitmanip',   label: 'Bit Manipulation',   color: '#22D3EE' },
  { id: 'sorting',    label: 'Sorting Algorithms', color: '#CBD5E1' },
  { id: 'range',      label: 'Range Structures',   color: '#7C3AED' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
) as Record<CategoryId, DSACategory>
```

- [ ] **Step 2: Create src/lib/colors.ts**

```typescript
// src/lib/colors.ts
import { CATEGORY_MAP, type CategoryId } from '@/data/categories'

export function categoryColor(id: CategoryId | string): string {
  return CATEGORY_MAP[id as CategoryId]?.color ?? '#808080'
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
```

- [ ] **Step 3: Create src/data/patterns.ts**

```typescript
// src/data/patterns.ts
import type { CategoryId } from './categories'

export interface PatternNode {
  id: string
  label: string
  category: CategoryId
  depth: number          // 0=root 1=category 2=pattern 3=sub 4=leaf
  parentId: string | null
  childIds: string[]
  isLeaf: boolean
  color: string
}

export const PATTERNS: PatternNode[] = [
  // ── ROOT ──────────────────────────────────────────────────────────────────
  { id:'root', label:'DSA Patterns', category:'array', depth:0, parentId:null,
    childIds:['array','string','hashmap','stack','queue','linkedlist','trees','recursion','heap','graphs','trie','dp','greedy','bitmanip','sorting','range'],
    isLeaf:false, color:'#ffffff' },

  // ── CATEGORIES (depth 1) ──────────────────────────────────────────────────
  { id:'array',      label:'Array',               category:'array',      depth:1, parentId:'root', childIds:['arr-twopointer','arr-slidingwindow','arr-prefix','arr-kadane','arr-binarysearch'], isLeaf:false, color:'#00E5FF' },
  { id:'string',     label:'String',              category:'string',     depth:1, parentId:'root', childIds:['str-slidingwindow','str-twopointers','str-patternmatching'], isLeaf:false, color:'#4DFFB4' },
  { id:'hashmap',    label:'Hash Map',             category:'hashmap',    depth:1, parentId:'root', childIds:['hm-frequency','hm-lookup','hm-set','hm-indexmapping','hm-grouping'], isLeaf:false, color:'#FFD700' },
  { id:'stack',      label:'Stack',               category:'stack',      depth:1, parentId:'root', childIds:['stk-monotonic','stk-nearest','stk-range','stk-minmax','stk-expression','stk-histogram'], isLeaf:false, color:'#FF6B6B' },
  { id:'queue',      label:'Queue / Deque',       category:'queue',      depth:1, parentId:'root', childIds:['q-fifo','q-levelwise','q-circular','q-deque'], isLeaf:false, color:'#A78BFA' },
  { id:'linkedlist', label:'Linked List',         category:'linkedlist', depth:1, parentId:'root', childIds:['ll-pointer','ll-reversal','ll-merge'], isLeaf:false, color:'#60CFFF' },
  { id:'trees',      label:'Trees',               category:'trees',      depth:1, parentId:'root', childIds:['tr-traversal','tr-recursion','tr-path','tr-bst'], isLeaf:false, color:'#34D399' },
  { id:'recursion',  label:'Recursion',           category:'recursion',  depth:1, parentId:'root', childIds:['rec-backtracking','rec-divideconquer'], isLeaf:false, color:'#FB923C' },
  { id:'heap',       label:'Heap',                category:'heap',       depth:1, parentId:'root', childIds:['hp-topk','hp-greedyheap','hp-kmerge'], isLeaf:false, color:'#F59E0B' },
  { id:'graphs',     label:'Graphs',              category:'graphs',     depth:1, parentId:'root', childIds:['gr-traversal','gr-cycle','gr-topo','gr-shortest','gr-spanning','gr-unionfind','gr-bipartite'], isLeaf:false, color:'#818CF8' },
  { id:'trie',       label:'Trie',                category:'trie',       depth:1, parentId:'root', childIds:['trie-prefix','trie-bitwise'], isLeaf:false, color:'#EC4899' },
  { id:'dp',         label:'Dynamic Programming', category:'dp',         depth:1, parentId:'root', childIds:['dp-core','dp-transition','dp-patterns','dp-advanced','dp-optimization'], isLeaf:false, color:'#6EE7B7' },
  { id:'greedy',     label:'Greedy',              category:'greedy',     depth:1, parentId:'root', childIds:['gr2-interval','gr2-scheduling','gr2-resource','gr2-jumpgame','gr2-huffman'], isLeaf:false, color:'#FCA5A5' },
  { id:'bitmanip',   label:'Bit Manipulation',    category:'bitmanip',   depth:1, parentId:'root', childIds:['bit-core','bit-usage'], isLeaf:false, color:'#22D3EE' },
  { id:'sorting',    label:'Sorting Algorithms',  category:'sorting',    depth:1, parentId:'root', childIds:['sort-bubble','sort-selection','sort-insertion','sort-merge','sort-quick','sort-heap','sort-counting','sort-radix','sort-bucket'], isLeaf:false, color:'#CBD5E1' },
  { id:'range',      label:'Range Structures',    category:'range',      depth:1, parentId:'root', childIds:['rng-segtree','rng-fenwick'], isLeaf:false, color:'#7C3AED' },

  // ── ARRAY (depth 2) ───────────────────────────────────────────────────────
  { id:'arr-twopointer',    label:'Two Pointer',        category:'array', depth:2, parentId:'array',      childIds:['arr-tp-near','arr-tp-far','arr-tp-multi'], isLeaf:false, color:'#00E5FF' },
  { id:'arr-slidingwindow', label:'Sliding Window',     category:'array', depth:2, parentId:'array',      childIds:['arr-sw-fixed','arr-sw-variable'], isLeaf:false, color:'#00E5FF' },
  { id:'arr-prefix',        label:'Prefix Based',       category:'array', depth:2, parentId:'array',      childIds:['arr-pf-sum','arr-pf-xor','arr-pf-2d'], isLeaf:false, color:'#00E5FF' },
  { id:'arr-kadane',        label:"Kadane's / Subarray",category:'array', depth:2, parentId:'array',      childIds:['arr-kd-algo','arr-kd-maxmin','arr-kd-count'], isLeaf:false, color:'#00E5FF' },
  { id:'arr-binarysearch',  label:'Binary Search',      category:'array', depth:2, parentId:'array',      childIds:['arr-bs-array','arr-bs-answer'], isLeaf:false, color:'#00E5FF' },

  // Array depth 3
  { id:'arr-tp-near',     label:'Near Pointers',          category:'array', depth:3, parentId:'arr-twopointer',    childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-tp-far',      label:'Far Pointers',           category:'array', depth:3, parentId:'arr-twopointer',    childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-tp-multi',    label:'Multiple Arrays',        category:'array', depth:3, parentId:'arr-twopointer',    childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-sw-fixed',    label:'Fixed Size',             category:'array', depth:3, parentId:'arr-slidingwindow', childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-sw-variable', label:'Variable Size',          category:'array', depth:3, parentId:'arr-slidingwindow', childIds:['arr-sw-var-expand','arr-sw-var-mono'], isLeaf:false, color:'#00E5FF' },
  { id:'arr-pf-sum',      label:'Prefix Sum',             category:'array', depth:3, parentId:'arr-prefix',        childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-pf-xor',      label:'Prefix XOR',             category:'array', depth:3, parentId:'arr-prefix',        childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-pf-2d',       label:'2D Prefix',              category:'array', depth:3, parentId:'arr-prefix',        childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-kd-algo',     label:"Kadane's Algorithm",     category:'array', depth:3, parentId:'arr-kadane',        childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-kd-maxmin',   label:'Max Min Subarray',       category:'array', depth:3, parentId:'arr-kadane',        childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-kd-count',    label:'Count / Bool Subarray',  category:'array', depth:3, parentId:'arr-kadane',        childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-bs-array',    label:'On Array',               category:'array', depth:3, parentId:'arr-binarysearch',  childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-bs-answer',   label:'On Answer',              category:'array', depth:3, parentId:'arr-binarysearch',  childIds:[], isLeaf:true, color:'#00E5FF' },

  // Array depth 4
  { id:'arr-sw-var-expand', label:'Expand-Shrink',      category:'array', depth:4, parentId:'arr-sw-variable', childIds:[], isLeaf:true, color:'#00E5FF' },
  { id:'arr-sw-var-mono',   label:'Monotonic Window',   category:'array', depth:4, parentId:'arr-sw-variable', childIds:[], isLeaf:true, color:'#00E5FF' },

  // ── STRING (depth 2) ──────────────────────────────────────────────────────
  { id:'str-slidingwindow',   label:'Sliding Window',    category:'string', depth:2, parentId:'string', childIds:['str-sw-longest','str-sw-min','str-sw-anagram'], isLeaf:false, color:'#4DFFB4' },
  { id:'str-twopointers',     label:'Two Pointers',      category:'string', depth:2, parentId:'string', childIds:['str-tp-palindrome','str-tp-reverse','str-tp-partition'], isLeaf:false, color:'#4DFFB4' },
  { id:'str-patternmatching', label:'Pattern Matching',  category:'string', depth:2, parentId:'string', childIds:['str-pm-kmp','str-pm-rabin','str-pm-z'], isLeaf:false, color:'#4DFFB4' },

  { id:'str-sw-longest',    label:'Longest Substring',  category:'string', depth:3, parentId:'str-slidingwindow',   childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-sw-min',        label:'Minimum Window',     category:'string', depth:3, parentId:'str-slidingwindow',   childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-sw-anagram',    label:'Anagram Search',     category:'string', depth:3, parentId:'str-slidingwindow',   childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-tp-palindrome', label:'Palindrome Check',   category:'string', depth:3, parentId:'str-twopointers',     childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-tp-reverse',    label:'Reverse',            category:'string', depth:3, parentId:'str-twopointers',     childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-tp-partition',  label:'Partition',          category:'string', depth:3, parentId:'str-twopointers',     childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-pm-kmp',        label:'KMP',                category:'string', depth:3, parentId:'str-patternmatching', childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-pm-rabin',      label:'Rabin-Karp',         category:'string', depth:3, parentId:'str-patternmatching', childIds:[], isLeaf:true, color:'#4DFFB4' },
  { id:'str-pm-z',          label:'Z-Algorithm',        category:'string', depth:3, parentId:'str-patternmatching', childIds:[], isLeaf:true, color:'#4DFFB4' },

  // ── HASH MAP (depth 2, all leaves) ────────────────────────────────────────
  { id:'hm-frequency',   label:'Frequency Based',  category:'hashmap', depth:2, parentId:'hashmap', childIds:[], isLeaf:true, color:'#FFD700' },
  { id:'hm-lookup',      label:'Lookup Based',     category:'hashmap', depth:2, parentId:'hashmap', childIds:[], isLeaf:true, color:'#FFD700' },
  { id:'hm-set',         label:'Set Based',        category:'hashmap', depth:2, parentId:'hashmap', childIds:[], isLeaf:true, color:'#FFD700' },
  { id:'hm-indexmapping',label:'Index Mapping',    category:'hashmap', depth:2, parentId:'hashmap', childIds:[], isLeaf:true, color:'#FFD700' },
  { id:'hm-grouping',    label:'Grouping Pattern', category:'hashmap', depth:2, parentId:'hashmap', childIds:[], isLeaf:true, color:'#FFD700' },

  // ── STACK (depth 2) ───────────────────────────────────────────────────────
  { id:'stk-monotonic',  label:'Monotonic Stack',    category:'stack', depth:2, parentId:'stack', childIds:['stk-mono-inc','stk-mono-dec'], isLeaf:false, color:'#FF6B6B' },
  { id:'stk-nearest',    label:'Nearest Element',    category:'stack', depth:2, parentId:'stack', childIds:['stk-near-nge','stk-near-nse','stk-near-prev'], isLeaf:false, color:'#FF6B6B' },
  { id:'stk-range',      label:'Range / Span',       category:'stack', depth:2, parentId:'stack', childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-minmax',     label:'Min / Max Stack',    category:'stack', depth:2, parentId:'stack', childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-expression', label:'Expression Handling',category:'stack', depth:2, parentId:'stack', childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-histogram',  label:'Histogram Pattern',  category:'stack', depth:2, parentId:'stack', childIds:[], isLeaf:true, color:'#FF6B6B' },

  { id:'stk-mono-inc',  label:'Increasing',  category:'stack', depth:3, parentId:'stk-monotonic', childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-mono-dec',  label:'Decreasing',  category:'stack', depth:3, parentId:'stk-monotonic', childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-near-nge',  label:'NGE',         category:'stack', depth:3, parentId:'stk-nearest',   childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-near-nse',  label:'NSE',         category:'stack', depth:3, parentId:'stk-nearest',   childIds:[], isLeaf:true, color:'#FF6B6B' },
  { id:'stk-near-prev', label:'Previous Greater / Smaller', category:'stack', depth:3, parentId:'stk-nearest', childIds:[], isLeaf:true, color:'#FF6B6B' },

  // ── QUEUE / DEQUE (depth 2, all leaves) ──────────────────────────────────
  { id:'q-fifo',      label:'FIFO',                  category:'queue', depth:2, parentId:'queue', childIds:[], isLeaf:true, color:'#A78BFA' },
  { id:'q-levelwise', label:'Level-wise',            category:'queue', depth:2, parentId:'queue', childIds:[], isLeaf:true, color:'#A78BFA' },
  { id:'q-circular',  label:'Circular Queue Pattern',category:'queue', depth:2, parentId:'queue', childIds:[], isLeaf:true, color:'#A78BFA' },
  { id:'q-deque',     label:'Deque Based',           category:'queue', depth:2, parentId:'queue', childIds:[], isLeaf:true, color:'#A78BFA' },

  // ── LINKED LIST (depth 2) ─────────────────────────────────────────────────
  { id:'ll-pointer', label:'Pointer Techniques', category:'linkedlist', depth:2, parentId:'linkedlist', childIds:['ll-pt-fastslow','ll-pt-cycle','ll-pt-middle'], isLeaf:false, color:'#60CFFF' },
  { id:'ll-reversal',label:'Reversal',           category:'linkedlist', depth:2, parentId:'linkedlist', childIds:['ll-rev-iter','ll-rev-rec'], isLeaf:false, color:'#60CFFF' },
  { id:'ll-merge',   label:'Merge Lists',        category:'linkedlist', depth:2, parentId:'linkedlist', childIds:[], isLeaf:true, color:'#60CFFF' },

  { id:'ll-pt-fastslow', label:'Fast-Slow',         category:'linkedlist', depth:3, parentId:'ll-pointer', childIds:[], isLeaf:true, color:'#60CFFF' },
  { id:'ll-pt-cycle',    label:'Cycle Detection',   category:'linkedlist', depth:3, parentId:'ll-pointer', childIds:[], isLeaf:true, color:'#60CFFF' },
  { id:'ll-pt-middle',   label:'Finding Middle',    category:'linkedlist', depth:3, parentId:'ll-pointer', childIds:[], isLeaf:true, color:'#60CFFF' },
  { id:'ll-rev-iter',    label:'Iterative',         category:'linkedlist', depth:3, parentId:'ll-reversal',childIds:[], isLeaf:true, color:'#60CFFF' },
  { id:'ll-rev-rec',     label:'Recursive',         category:'linkedlist', depth:3, parentId:'ll-reversal',childIds:[], isLeaf:true, color:'#60CFFF' },

  // ── TREES (depth 2) ───────────────────────────────────────────────────────
  { id:'tr-traversal',label:'Traversal',          category:'trees', depth:2, parentId:'trees', childIds:['tr-trav-dfs','tr-trav-bfs'], isLeaf:false, color:'#34D399' },
  { id:'tr-recursion',label:'Recursion Patterns', category:'trees', depth:2, parentId:'trees', childIds:['tr-rec-topdown','tr-rec-bottomup'], isLeaf:false, color:'#34D399' },
  { id:'tr-path',     label:'Path Based',         category:'trees', depth:2, parentId:'trees', childIds:['tr-path-root','tr-path-any'], isLeaf:false, color:'#34D399' },
  { id:'tr-bst',      label:'BST',                category:'trees', depth:2, parentId:'trees', childIds:[], isLeaf:true, color:'#34D399' },

  { id:'tr-trav-dfs',      label:'DFS',             category:'trees', depth:3, parentId:'tr-traversal', childIds:[], isLeaf:true, color:'#34D399' },
  { id:'tr-trav-bfs',      label:'BFS',             category:'trees', depth:3, parentId:'tr-traversal', childIds:[], isLeaf:true, color:'#34D399' },
  { id:'tr-rec-topdown',   label:'Top-Down',        category:'trees', depth:3, parentId:'tr-recursion', childIds:[], isLeaf:true, color:'#34D399' },
  { id:'tr-rec-bottomup',  label:'Bottom-Up',       category:'trees', depth:3, parentId:'tr-recursion', childIds:[], isLeaf:true, color:'#34D399' },
  { id:'tr-path-root',     label:'Root to Leaf',    category:'trees', depth:3, parentId:'tr-path',      childIds:[], isLeaf:true, color:'#34D399' },
  { id:'tr-path-any',      label:'Any Path',        category:'trees', depth:3, parentId:'tr-path',      childIds:[], isLeaf:true, color:'#34D399' },

  // ── RECURSION (depth 2) ───────────────────────────────────────────────────
  { id:'rec-backtracking',   label:'Backtracking',     category:'recursion', depth:2, parentId:'recursion', childIds:['rec-bt-exploration','rec-bt-pruning'], isLeaf:false, color:'#FB923C' },
  { id:'rec-divideconquer',  label:'Divide & Conquer', category:'recursion', depth:2, parentId:'recursion', childIds:['rec-dc-split','rec-dc-merge','rec-dc-combine'], isLeaf:false, color:'#FB923C' },

  { id:'rec-bt-exploration', label:'Exploration',         category:'recursion', depth:3, parentId:'rec-backtracking',  childIds:['rec-bt-ex-decision','rec-bt-ex-cec','rec-bt-ex-subsets','rec-bt-ex-perms','rec-bt-ex-wordsearch','rec-bt-ex-palindrome'], isLeaf:false, color:'#FB923C' },
  { id:'rec-bt-pruning',     label:'Pruning / State Tracking', category:'recursion', depth:3, parentId:'rec-backtracking', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-dc-split',       label:'Split',              category:'recursion', depth:3, parentId:'rec-divideconquer', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-dc-merge',       label:'Merge',              category:'recursion', depth:3, parentId:'rec-divideconquer', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-dc-combine',     label:'Combine',            category:'recursion', depth:3, parentId:'rec-divideconquer', childIds:[], isLeaf:true, color:'#FB923C' },

  // Recursion depth 4
  { id:'rec-bt-ex-decision',  label:'Decision Tree',              category:'recursion', depth:4, parentId:'rec-bt-exploration', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-bt-ex-cec',       label:'Choose-Explore-Unchoose',    category:'recursion', depth:4, parentId:'rec-bt-exploration', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-bt-ex-subsets',   label:'Subsets',                    category:'recursion', depth:4, parentId:'rec-bt-exploration', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-bt-ex-perms',     label:'Permutations',               category:'recursion', depth:4, parentId:'rec-bt-exploration', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-bt-ex-wordsearch',label:'Word Search on Grid',        category:'recursion', depth:4, parentId:'rec-bt-exploration', childIds:[], isLeaf:true, color:'#FB923C' },
  { id:'rec-bt-ex-palindrome',label:'Palindrome Partitioning',    category:'recursion', depth:4, parentId:'rec-bt-exploration', childIds:[], isLeaf:true, color:'#FB923C' },

  // ── HEAP (depth 2) ────────────────────────────────────────────────────────
  { id:'hp-topk',      label:'Top K / Kth Element / K Closest', category:'heap', depth:2, parentId:'heap', childIds:[], isLeaf:true, color:'#F59E0B' },
  { id:'hp-greedyheap',label:'Greedy + Heap',                   category:'heap', depth:2, parentId:'heap', childIds:['hp-gh-taskscheduling','hp-gh-meetingrooms','hp-gh-ropes','hp-gh-mincost'], isLeaf:false, color:'#F59E0B' },
  { id:'hp-kmerge',    label:'K-way Merge',                     category:'heap', depth:2, parentId:'heap', childIds:[], isLeaf:true, color:'#F59E0B' },

  { id:'hp-gh-taskscheduling', label:'Task Scheduling',  category:'heap', depth:3, parentId:'hp-greedyheap', childIds:[], isLeaf:true, color:'#F59E0B' },
  { id:'hp-gh-meetingrooms',   label:'Meeting Rooms',    category:'heap', depth:3, parentId:'hp-greedyheap', childIds:[], isLeaf:true, color:'#F59E0B' },
  { id:'hp-gh-ropes',          label:'Connect Ropes',    category:'heap', depth:3, parentId:'hp-greedyheap', childIds:[], isLeaf:true, color:'#F59E0B' },
  { id:'hp-gh-mincost',        label:'Minimize Cost',    category:'heap', depth:3, parentId:'hp-greedyheap', childIds:[], isLeaf:true, color:'#F59E0B' },

  // ── GRAPHS (depth 2) ──────────────────────────────────────────────────────
  { id:'gr-traversal', label:'Traversal',         category:'graphs', depth:2, parentId:'graphs', childIds:['gr-trav-dfs','gr-trav-bfs'], isLeaf:false, color:'#818CF8' },
  { id:'gr-cycle',     label:'Cycle Detection',   category:'graphs', depth:2, parentId:'graphs', childIds:['gr-cyc-directed','gr-cyc-undirected'], isLeaf:false, color:'#818CF8' },
  { id:'gr-topo',      label:'Topological Sort',  category:'graphs', depth:2, parentId:'graphs', childIds:['gr-topo-kahn','gr-topo-dfs','gr-topo-apps'], isLeaf:false, color:'#818CF8' },
  { id:'gr-shortest',  label:'Shortest Path',     category:'graphs', depth:2, parentId:'graphs', childIds:['gr-sp-dijkstra','gr-sp-bellman','gr-sp-floyd'], isLeaf:false, color:'#818CF8' },
  { id:'gr-spanning',  label:'Spanning Tree',     category:'graphs', depth:2, parentId:'graphs', childIds:['gr-span-prim','gr-span-kruskal'], isLeaf:false, color:'#818CF8' },
  { id:'gr-unionfind', label:'Union-Find / DSU',  category:'graphs', depth:2, parentId:'graphs', childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-bipartite', label:'Bipartite / Multi-source BFS / 0-1 BFS', category:'graphs', depth:2, parentId:'graphs', childIds:[], isLeaf:true, color:'#818CF8' },

  { id:'gr-trav-dfs',      label:'DFS',            category:'graphs', depth:3, parentId:'gr-traversal', childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-trav-bfs',      label:'BFS',            category:'graphs', depth:3, parentId:'gr-traversal', childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-cyc-directed',  label:'Directed',       category:'graphs', depth:3, parentId:'gr-cycle',     childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-cyc-undirected',label:'Undirected',     category:'graphs', depth:3, parentId:'gr-cycle',     childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-topo-kahn',     label:"BFS (Kahn's)",   category:'graphs', depth:3, parentId:'gr-topo',      childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-topo-dfs',      label:'DFS',            category:'graphs', depth:3, parentId:'gr-topo',      childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-topo-apps',     label:'Applications',   category:'graphs', depth:3, parentId:'gr-topo',      childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-sp-dijkstra',   label:"Dijkstra's",     category:'graphs', depth:3, parentId:'gr-shortest',  childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-sp-bellman',    label:'Bellman-Ford',   category:'graphs', depth:3, parentId:'gr-shortest',  childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-sp-floyd',      label:'Floyd-Warshall', category:'graphs', depth:3, parentId:'gr-shortest',  childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-span-prim',     label:"Prim's",         category:'graphs', depth:3, parentId:'gr-spanning',  childIds:[], isLeaf:true, color:'#818CF8' },
  { id:'gr-span-kruskal',  label:"Kruskal's",      category:'graphs', depth:3, parentId:'gr-spanning',  childIds:[], isLeaf:true, color:'#818CF8' },

  // ── TRIE (depth 2) ────────────────────────────────────────────────────────
  { id:'trie-prefix', label:'Prefix Based', category:'trie', depth:2, parentId:'trie', childIds:['trie-pf-wordsearch','trie-pf-autocomplete'], isLeaf:false, color:'#EC4899' },
  { id:'trie-bitwise',label:'Bitwise Trie', category:'trie', depth:2, parentId:'trie', childIds:[], isLeaf:true, color:'#EC4899' },

  { id:'trie-pf-wordsearch',   label:'Word Search',  category:'trie', depth:3, parentId:'trie-prefix', childIds:[], isLeaf:true, color:'#EC4899' },
  { id:'trie-pf-autocomplete', label:'Autocomplete', category:'trie', depth:3, parentId:'trie-prefix', childIds:[], isLeaf:true, color:'#EC4899' },

  // ── DYNAMIC PROGRAMMING (depth 2) ─────────────────────────────────────────
  { id:'dp-core',        label:'Core',          category:'dp', depth:2, parentId:'dp', childIds:['dp-core-1d','dp-core-2d'], isLeaf:false, color:'#6EE7B7' },
  { id:'dp-transition',  label:'Transition Type',category:'dp', depth:2, parentId:'dp', childIds:['dp-tr-incexc','dp-tr-choose','dp-tr-partition'], isLeaf:false, color:'#6EE7B7' },
  { id:'dp-patterns',    label:'Pattern Types', category:'dp', depth:2, parentId:'dp', childIds:['dp-pt-lcs','dp-pt-knapsack','dp-pt-stock','dp-pt-grid'], isLeaf:false, color:'#6EE7B7' },
  { id:'dp-advanced',    label:'Advanced',      category:'dp', depth:2, parentId:'dp', childIds:['dp-adv-bitmask','dp-adv-tree','dp-adv-digit'], isLeaf:false, color:'#6EE7B7' },
  { id:'dp-optimization',label:'Optimization',  category:'dp', depth:2, parentId:'dp', childIds:['dp-opt-space','dp-opt-state'], isLeaf:false, color:'#6EE7B7' },

  { id:'dp-core-1d',       label:'1D DP',              category:'dp', depth:3, parentId:'dp-core',        childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-core-2d',       label:'2D DP',              category:'dp', depth:3, parentId:'dp-core',        childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-tr-incexc',     label:'Include / Exclude',  category:'dp', depth:3, parentId:'dp-transition',  childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-tr-choose',     label:'Choose Among K',     category:'dp', depth:3, parentId:'dp-transition',  childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-tr-partition',  label:'Partition',          category:'dp', depth:3, parentId:'dp-transition',  childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-pt-lcs',        label:'LCS Family',         category:'dp', depth:3, parentId:'dp-patterns',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-pt-knapsack',   label:'Knapsack Family',    category:'dp', depth:3, parentId:'dp-patterns',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-pt-stock',      label:'Stock Problems',     category:'dp', depth:3, parentId:'dp-patterns',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-pt-grid',       label:'Grid Paths',         category:'dp', depth:3, parentId:'dp-patterns',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-adv-bitmask',   label:'Bitmask DP',         category:'dp', depth:3, parentId:'dp-advanced',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-adv-tree',      label:'Tree DP',            category:'dp', depth:3, parentId:'dp-advanced',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-adv-digit',     label:'Digit DP',           category:'dp', depth:3, parentId:'dp-advanced',    childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-opt-space',     label:'Space Optimization', category:'dp', depth:3, parentId:'dp-optimization',childIds:[], isLeaf:true, color:'#6EE7B7' },
  { id:'dp-opt-state',     label:'State Compression',  category:'dp', depth:3, parentId:'dp-optimization',childIds:[], isLeaf:true, color:'#6EE7B7' },

  // ── GREEDY (depth 2) ──────────────────────────────────────────────────────
  { id:'gr2-interval',   label:'Interval Greedy',    category:'greedy', depth:2, parentId:'greedy', childIds:['gr2-int-activity','gr2-int-meeting','gr2-int-merge'], isLeaf:false, color:'#FCA5A5' },
  { id:'gr2-scheduling', label:'Scheduling Greedy',  category:'greedy', depth:2, parentId:'greedy', childIds:['gr2-sch-job','gr2-sch-cpu'], isLeaf:false, color:'#FCA5A5' },
  { id:'gr2-resource',   label:'Resource Allocation',category:'greedy', depth:2, parentId:'greedy', childIds:['gr2-res-fractional','gr2-res-assign'], isLeaf:false, color:'#FCA5A5' },
  { id:'gr2-jumpgame',   label:'Jump Game Pattern',  category:'greedy', depth:2, parentId:'greedy', childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-huffman',    label:'Huffman / Merge Cost',category:'greedy',depth:2, parentId:'greedy', childIds:[], isLeaf:true, color:'#FCA5A5' },

  { id:'gr2-int-activity',   label:'Activity Selection',    category:'greedy', depth:3, parentId:'gr2-interval',   childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-int-meeting',    label:'Meeting Rooms',         category:'greedy', depth:3, parentId:'gr2-interval',   childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-int-merge',      label:'Merge Intervals',       category:'greedy', depth:3, parentId:'gr2-interval',   childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-sch-job',        label:'Job Scheduling',        category:'greedy', depth:3, parentId:'gr2-scheduling', childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-sch-cpu',        label:'CPU Scheduling',        category:'greedy', depth:3, parentId:'gr2-scheduling', childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-res-fractional', label:'Fractional Knapsack',   category:'greedy', depth:3, parentId:'gr2-resource',   childIds:[], isLeaf:true, color:'#FCA5A5' },
  { id:'gr2-res-assign',     label:'Assign Tasks',          category:'greedy', depth:3, parentId:'gr2-resource',   childIds:[], isLeaf:true, color:'#FCA5A5' },

  // ── BIT MANIPULATION (depth 2) ────────────────────────────────────────────
  { id:'bit-core', label:'Core',  category:'bitmanip', depth:2, parentId:'bitmanip', childIds:['bit-core-xor','bit-core-mask'], isLeaf:false, color:'#22D3EE' },
  { id:'bit-usage',label:'Usage', category:'bitmanip', depth:2, parentId:'bitmanip', childIds:['bit-use-subset','bit-use-checks','bit-use-prefixXOR'], isLeaf:false, color:'#22D3EE' },

  { id:'bit-core-xor',      label:'XOR Pattern',    category:'bitmanip', depth:3, parentId:'bit-core',  childIds:[], isLeaf:true, color:'#22D3EE' },
  { id:'bit-core-mask',     label:'Bit Masking',    category:'bitmanip', depth:3, parentId:'bit-core',  childIds:[], isLeaf:true, color:'#22D3EE' },
  { id:'bit-use-subset',    label:'Subset via Bits',category:'bitmanip', depth:3, parentId:'bit-usage', childIds:[], isLeaf:true, color:'#22D3EE' },
  { id:'bit-use-checks',    label:'Bit Checks',     category:'bitmanip', depth:3, parentId:'bit-usage', childIds:[], isLeaf:true, color:'#22D3EE' },
  { id:'bit-use-prefixXOR', label:'Prefix XOR',     category:'bitmanip', depth:3, parentId:'bit-usage', childIds:[], isLeaf:true, color:'#22D3EE' },

  // ── SORTING (depth 2, all leaves) ─────────────────────────────────────────
  { id:'sort-bubble',   label:'Bubble Sort',    category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-selection',label:'Selection Sort', category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-insertion',label:'Insertion Sort', category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-merge',    label:'Merge Sort',     category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-quick',    label:'Quick Sort',     category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-heap',     label:'Heap Sort',      category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-counting', label:'Counting Sort',  category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-radix',    label:'Radix Sort',     category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },
  { id:'sort-bucket',   label:'Bucket Sort',    category:'sorting', depth:2, parentId:'sorting', childIds:[], isLeaf:true, color:'#CBD5E1' },

  // ── RANGE STRUCTURES (depth 2) ────────────────────────────────────────────
  { id:'rng-segtree', label:'Segment Tree', category:'range', depth:2, parentId:'range', childIds:['rng-seg-rangequery','rng-seg-lazy'], isLeaf:false, color:'#7C3AED' },
  { id:'rng-fenwick', label:'Fenwick Tree', category:'range', depth:2, parentId:'range', childIds:['rng-fen-prefix'], isLeaf:false, color:'#7C3AED' },

  { id:'rng-seg-rangequery',label:'Range Query',       category:'range', depth:3, parentId:'rng-segtree', childIds:[], isLeaf:true, color:'#7C3AED' },
  { id:'rng-seg-lazy',      label:'Lazy Propagation',  category:'range', depth:3, parentId:'rng-segtree', childIds:[], isLeaf:true, color:'#7C3AED' },
  { id:'rng-fen-prefix',    label:'Prefix Query',       category:'range', depth:3, parentId:'rng-fenwick', childIds:[], isLeaf:true, color:'#7C3AED' },
]

export const PATTERN_MAP = Object.fromEntries(
  PATTERNS.map(p => [p.id, p])
) as Record<string, PatternNode>
```

- [ ] **Step 4: Create src/data/problems.ts**

```typescript
// src/data/problems.ts
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Platform   = 'LeetCode' | 'CodeChef' | 'SPOJ' | 'HackerRank' | 'GFG'

export interface Problem {
  id: string
  patternId: string
  title: string
  difficulty: Difficulty
  platform: Platform
  url: string
  slug: string
  whyThisPattern: string
  tags: string[]
}

export const PROBLEMS: Problem[] = [
  // ── Two Pointer ───────────────────────────────────────────────────────────
  { id:'p001', patternId:'arr-tp-near', title:'Two Sum II', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', slug:'two-sum-ii',
    whyThisPattern:'Classic near-pointer template — converge from both ends.', tags:['array','two-pointer'] },
  { id:'p002', patternId:'arr-tp-far', title:'Trapping Rain Water', difficulty:'Hard', platform:'LeetCode',
    url:'https://leetcode.com/problems/trapping-rain-water/', slug:'trapping-rain-water',
    whyThisPattern:'Far pointers track left-max and right-max simultaneously.', tags:['array','two-pointer'] },
  { id:'p003', patternId:'arr-tp-multi', title:'Merge Sorted Array', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/merge-sorted-array/', slug:'merge-sorted-array',
    whyThisPattern:'One pointer per array, merge from the back.', tags:['array','two-pointer'] },

  // ── Sliding Window ────────────────────────────────────────────────────────
  { id:'p004', patternId:'arr-sw-fixed', title:'Maximum Average Subarray I', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/maximum-average-subarray-i/', slug:'max-avg-subarray',
    whyThisPattern:'Fixed-size window — slide and update sum in O(1).', tags:['array','sliding-window'] },
  { id:'p005', patternId:'arr-sw-var-expand', title:'Longest Substring Without Repeating Characters', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/longest-substring-without-repeating-characters/', slug:'longest-substring-without-repeating',
    whyThisPattern:'Classic expand-shrink: grow until invalid, shrink from left.', tags:['string','sliding-window'] },
  { id:'p006', patternId:'arr-sw-var-mono', title:'Sliding Window Maximum', difficulty:'Hard', platform:'LeetCode',
    url:'https://leetcode.com/problems/sliding-window-maximum/', slug:'sliding-window-maximum',
    whyThisPattern:'Monotonic deque maintains max in O(1) per step.', tags:['array','deque','sliding-window'] },

  // ── Prefix ────────────────────────────────────────────────────────────────
  { id:'p007', patternId:'arr-pf-sum', title:'Subarray Sum Equals K', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/subarray-sum-equals-k/', slug:'subarray-sum-equals-k',
    whyThisPattern:'prefix[j] - prefix[i] = k → store prefix counts in a hash map.', tags:['array','prefix-sum'] },
  { id:'p008', patternId:'arr-pf-xor', title:'Subarray XOR Equals K', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/count-triplets-that-can-form-two-arrays-of-equal-xor/', slug:'subarray-xor',
    whyThisPattern:'XOR prefix: if prefix[i]^prefix[j]=0 the sub-range cancels out.', tags:['array','bit-manipulation'] },
  { id:'p009', patternId:'arr-pf-2d', title:'Matrix Block Sum', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/matrix-block-sum/', slug:'matrix-block-sum',
    whyThisPattern:'2D prefix: inclusion-exclusion on 4 corners gives any rectangle in O(1).', tags:['matrix','prefix'] },

  // ── Binary Search ─────────────────────────────────────────────────────────
  { id:'p010', patternId:'arr-bs-array', title:'Search in Rotated Sorted Array', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/search-in-rotated-sorted-array/', slug:'search-rotated-sorted',
    whyThisPattern:'Binary search still works — determine which half is sorted first.', tags:['array','binary-search'] },
  { id:'p011', patternId:'arr-bs-answer', title:'Koko Eating Bananas', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/koko-eating-bananas/', slug:'koko-eating-bananas',
    whyThisPattern:'Binary search on the answer space, not the array.', tags:['array','binary-search'] },

  // ── String ────────────────────────────────────────────────────────────────
  { id:'p012', patternId:'str-sw-longest', title:'Longest Substring with At Most K Distinct Characters', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/', slug:'longest-k-distinct',
    whyThisPattern:'Variable window — shrink when distinct count exceeds k.', tags:['string','sliding-window'] },
  { id:'p013', patternId:'str-sw-min', title:'Minimum Window Substring', difficulty:'Hard', platform:'LeetCode',
    url:'https://leetcode.com/problems/minimum-window-substring/', slug:'minimum-window-substring',
    whyThisPattern:'Expand to include all target chars, then shrink from left.', tags:['string','sliding-window'] },
  { id:'p014', patternId:'str-pm-kmp', title:'Find the Index of the First Occurrence', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', slug:'first-occurrence',
    whyThisPattern:'KMP failure function avoids re-scanning matched characters.', tags:['string','kmp'] },

  // ── Hash Map ──────────────────────────────────────────────────────────────
  { id:'p015', patternId:'hm-frequency', title:'Top K Frequent Elements', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/top-k-frequent-elements/', slug:'top-k-frequent',
    whyThisPattern:'Frequency map + bucket sort or heap to extract top-k.', tags:['hashmap','heap'] },
  { id:'p016', patternId:'hm-lookup', title:'Two Sum', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/two-sum/', slug:'two-sum',
    whyThisPattern:'Hash map stores complement for O(1) lookup per element.', tags:['hashmap'] },
  { id:'p017', patternId:'hm-grouping', title:'Group Anagrams', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/group-anagrams/', slug:'group-anagrams',
    whyThisPattern:'Sorted string or char-count tuple as key groups all anagrams.', tags:['hashmap','string'] },

  // ── Stack ─────────────────────────────────────────────────────────────────
  { id:'p018', patternId:'stk-mono-inc', title:'Daily Temperatures', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/daily-temperatures/', slug:'daily-temperatures',
    whyThisPattern:'Increasing monotonic stack — pop when a warmer day arrives.', tags:['stack','monotonic'] },
  { id:'p019', patternId:'stk-histogram', title:'Largest Rectangle in Histogram', difficulty:'Hard', platform:'LeetCode',
    url:'https://leetcode.com/problems/largest-rectangle-in-histogram/', slug:'largest-rectangle-histogram',
    whyThisPattern:'Stack of indices — pop when height decreases, compute area.', tags:['stack','histogram'] },

  // ── Queue ─────────────────────────────────────────────────────────────────
  { id:'p020', patternId:'q-levelwise', title:'Binary Tree Level Order Traversal', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/binary-tree-level-order-traversal/', slug:'binary-tree-level-order',
    whyThisPattern:'BFS queue processes nodes level by level — snapshot size at start.', tags:['bfs','queue','tree'] },

  // ── Linked List ───────────────────────────────────────────────────────────
  { id:'p021', patternId:'ll-pt-fastslow', title:'Linked List Cycle', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/linked-list-cycle/', slug:'linked-list-cycle',
    whyThisPattern:"Floyd's fast-slow: if they meet, there's a cycle.", tags:['linked-list','two-pointer'] },
  { id:'p022', patternId:'ll-rev-iter', title:'Reverse Linked List', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/reverse-linked-list/', slug:'reverse-linked-list',
    whyThisPattern:'Iterative 3-pointer reversal: prev, cur, next.', tags:['linked-list'] },

  // ── Trees ─────────────────────────────────────────────────────────────────
  { id:'p023', patternId:'tr-trav-dfs', title:'Maximum Depth of Binary Tree', difficulty:'Easy', platform:'LeetCode',
    url:'https://leetcode.com/problems/maximum-depth-of-binary-tree/', slug:'max-depth-binary-tree',
    whyThisPattern:'DFS post-order: max(left, right) + 1 at each node.', tags:['tree','dfs','recursion'] },
  { id:'p024', patternId:'tr-path-any', title:'Binary Tree Maximum Path Sum', difficulty:'Hard', platform:'LeetCode',
    url:'https://leetcode.com/problems/binary-tree-maximum-path-sum/', slug:'binary-tree-max-path-sum',
    whyThisPattern:'Post-order DFS: at each node compute max path through it.', tags:['tree','dfs'] },

  // ── Recursion / Backtracking ───────────────────────────────────────────────
  { id:'p025', patternId:'rec-bt-ex-subsets', title:'Subsets', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/subsets/', slug:'subsets',
    whyThisPattern:'Choose-Explore-Unchoose generates the power set.', tags:['backtracking','recursion'] },
  { id:'p026', patternId:'rec-bt-ex-perms', title:'Permutations', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/permutations/', slug:'permutations',
    whyThisPattern:'Swap-based or used-set backtracking builds all orderings.', tags:['backtracking','recursion'] },

  // ── Heap ──────────────────────────────────────────────────────────────────
  { id:'p027', patternId:'hp-topk', title:'Kth Largest Element in an Array', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/kth-largest-element-in-an-array/', slug:'kth-largest',
    whyThisPattern:'Min-heap of size k: pop when > k, top is the kth largest.', tags:['heap','sorting'] },

  // ── Graphs ────────────────────────────────────────────────────────────────
  { id:'p028', patternId:'gr-topo-kahn', title:'Course Schedule', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/course-schedule/', slug:'course-schedule',
    whyThisPattern:"Kahn's algorithm — BFS from in-degree-0 nodes detects cycle.", tags:['graph','topological-sort','bfs'] },
  { id:'p029', patternId:'gr-sp-dijkstra', title:'Network Delay Time', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/network-delay-time/', slug:'network-delay-time',
    whyThisPattern:"Dijkstra's min-heap: always expand the closest unvisited node.", tags:['graph','shortest-path','heap'] },

  // ── DP ────────────────────────────────────────────────────────────────────
  { id:'p030', patternId:'dp-pt-knapsack', title:'Partition Equal Subset Sum', difficulty:'Medium', platform:'LeetCode',
    url:'https://leetcode.com/problems/partition-equal-subset-sum/', slug:'partition-equal-subset',
    whyThisPattern:'0/1 knapsack: can we reach target sum using a subset?', tags:['dp','knapsack'] },
]

export const PROBLEM_MAP = Object.fromEntries(
  PROBLEMS.map(p => [p.id, p])
) as Record<string, Problem>

export function problemsByPattern(patternId: string): Problem[] {
  return PROBLEMS.filter(p => p.patternId === patternId)
}
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors (or only "Cannot find module" for packages not yet consumed — that's fine at this stage).

- [ ] **Step 6: Commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/data/ src/lib/
git commit -m "feat: add complete DSA data layer — 182 patterns, 30 problems, 16 categories"
```

---

### Task 4: GrainOverlay + Root layout + TopNav skeleton

**Files:**
- Create: `src/components/GrainOverlay.tsx`
- Create: `src/components/TopNav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create GrainOverlay**

```tsx
// src/components/GrainOverlay.tsx
export function GrainOverlay() {
  return <div className="grain" aria-hidden="true" />
}
```

- [ ] **Step 2: Create TopNav skeleton** (eye placeholder for now)

```tsx
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
```

- [ ] **Step 3: Update root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { GrainOverlay } from '@/components/GrainOverlay'
import { TopNav } from '@/components/TopNav'
import './globals.css'

export const metadata: Metadata = {
  title: 'algo-n-fun — Crack the Pattern. Own the Problem.',
  description: '182 DSA patterns mapped as an interactive 3D force graph. Find your pattern, crack the problem.',
}

export default function RootLayout({ children, overlay }: {
  children: React.ReactNode
  overlay: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <GrainOverlay />
        <TopNav />
        <main className="pt-14">{children}</main>
        {overlay}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Create @overlay/default.tsx (parallel route null state)**

```bash
mkdir -p /Users/pavankurmarao.k/Documents/personal/algo-n-fun/src/app/@overlay
```

```tsx
// src/app/@overlay/default.tsx
export default function OverlayDefault() {
  return null
}
```

- [ ] **Step 5: Create home page placeholder**

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
        3D graph loading soon…
      </p>
    </div>
  )
}
```

- [ ] **Step 6: Verify**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev &
sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
pkill -f "next dev"
```

Expected: `200`

- [ ] **Step 7: Commit**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/
git commit -m "feat: root layout with grain overlay, TopNav, @overlay parallel route"
```

---

### Task 5: CartographerEye — the signature animation

**Files:**
- Create: `src/components/CartographerEye.tsx`
- Modify: `src/components/TopNav.tsx`

- [ ] **Step 1: Create CartographerEye.tsx**

```tsx
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
  const absorbT    = useRef(0)  // 0=orbit, 1=absorbed
  const apertureT  = useRef(0)  // 0=closed, 1=open
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

    const drawOrbits = (t: number) => {
      octx.clearRect(0, 0, SIZE, SIZE)
      octx.save(); octx.beginPath(); octx.arc(CX, CY, IRIS_R, 0, Math.PI * 2); octx.clip()

      const absorb = absorbT.current

      // Text rings (3 concentric)
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

      // Orbiting nodes
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

      // Aperture glow when open
      if (open > 0.1) {
        const g = ovctx.createRadialGradient(px, py, 0, px, py, PR * 2.5)
        g.addColorStop(0, `rgba(255,215,0,${open * 0.6})`)
        g.addColorStop(1, 'rgba(255,215,0,0)')
        ovctx.beginPath(); ovctx.arc(px, py, PR * 2.5, 0, Math.PI * 2)
        ovctx.fillStyle = g; ovctx.fill()
      }

      // Pupil (partially hides during aperture open)
      if (open < 0.8) {
        ovctx.beginPath(); ovctx.arc(px, py, PR * (1 - open * 0.5), 0, Math.PI * 2)
        ovctx.fillStyle = '#000009'; ovctx.fill()
        // highlight
        ovctx.beginPath(); ovctx.arc(px - 2, py - 2, 1.6, 0, Math.PI * 2)
        ovctx.fillStyle = `rgba(255,255,255,${0.85 - open * 0.5})`; ovctx.fill()
      }

      // Compass rose at center (golden, subtle)
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

      // Sclera ring
      ovctx.beginPath(); ovctx.arc(CX, CY, IRIS_R, 0, Math.PI * 2)
      ovctx.strokeStyle = `rgba(0,212,255,${0.2 + apertureT.current * 0.2})`
      ovctx.lineWidth = 0.6; ovctx.stroke()
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const frame = (ts: number) => {
      const h = hovered.current
      absorbT.current  = lerp(absorbT.current,  h ? 1 : 0, h ? 0.09 : 0.06)
      apertureT.current = lerp(apertureT.current, h ? 1 : 0, h ? 0.07 : 0.05)
      if (h && absorbT.current > 0.95 && !ringLocked.current) ringLocked.current = true
      if (!h && apertureT.current < 0.05) ringLocked.current = false

      drawIris(); drawOrbits(ts); drawOverlay()
      rafId.current = requestAnimationFrame(frame)
    }

    const irisTimer = setInterval(drawIris, 33)
    rafId.current = requestAnimationFrame(frame)
    return () => { clearInterval(irisTimer); cancelAnimationFrame(rafId.current) }
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
        {/* Layer 1: iris */}
        <canvas ref={irisRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        {/* Layer 2: orbiting nodes + text rings */}
        <canvas ref={orbitRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        {/* Layer 3: pupil + overlay */}
        <canvas ref={overlayRef} width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />

        {/* Aperture SVG — 6 petals, CSS-animated */}
        <svg
          width={SIZE} height={SIZE}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {[0,60,120,180,240,300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const tx  = CX + Math.cos(rad) * 8
            const ty  = CY + Math.sin(rad) * 8
            return (
              <motion.ellipse
                key={i}
                cx={tx} cy={ty}
                rx={7} ry={4}
                fill="#000009"
                style={{ transformOrigin: `${CX}px ${CY}px`, rotate: deg }}
                animate={{ opacity: apertureT.current > 0.3 ? 1 : 0 }}
              />
            )
          })}
        </svg>

        {/* Glass border */}
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
```

- [ ] **Step 2: Wire CartographerEye into TopNav**

Replace `<div id="eye-slot" />` in `TopNav.tsx`:

```tsx
// src/components/TopNav.tsx — add import at top:
import { CartographerEye } from './CartographerEye'

// replace <div id="eye-slot" /> with:
<CartographerEye />
```

- [ ] **Step 3: Verify visually**

```bash
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun && npm run dev
```

Open `http://localhost:3000`. The eye should appear in the top-right corner. Hover over it — nodes absorb, aperture begins to open. Move mouse around — pupil follows.

- [ ] **Step 4: Kill server and commit**

```bash
pkill -f "next dev"
cd /Users/pavankurmarao.k/Documents/personal/algo-n-fun
git add src/components/
git commit -m "feat: CartographerEye — orbiting nodes, aperture unlock, ring snap, particle burst"
```

---

**Phase 1 complete.** The project is scaffolded, design system is in place, all 182 pattern nodes are defined, 30 problems are curated, and the CartographerEye is running in the TopNav.

Proceed to Phase 2 plan: `docs/superpowers/plans/2026-05-17-algo-n-fun-p2-3dgraph.md`
