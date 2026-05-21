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

// ─── Palette ──────────────────────────────────────────────────────────────────
//
// Designed in HSL: every swatch sits at roughly L=58%, S=36% so the categories
// read as a single jewel-toned family rather than a screaming colour wheel.
// Hues are spread across the wheel so neighbours stay distinguishable.
//
//   teal · sage · gold · terracotta · lavender · steel · forest · amber
//   honey · periwinkle · rose · seafoam · coral · cyan · slate · mauve
//
export const CATEGORIES: DSACategory[] = [
  { id: 'array',      label: 'Array',               color: '#6BA9C9' },
  { id: 'string',     label: 'String',              color: '#7BB89B' },
  { id: 'hashmap',    label: 'Hash Map',            color: '#D4B26C' },
  { id: 'stack',      label: 'Stack',               color: '#C77B6F' },
  { id: 'queue',      label: 'Queue / Deque',       color: '#9F92C0' },
  { id: 'linkedlist', label: 'Linked List',         color: '#7BA4C9' },
  { id: 'trees',      label: 'Trees',               color: '#74AE82' },
  { id: 'recursion',  label: 'Recursion',           color: '#C58F65' },
  { id: 'heap',       label: 'Heap',                color: '#C9A965' },
  { id: 'graphs',     label: 'Graphs',              color: '#8893C2' },
  { id: 'trie',       label: 'Trie',                color: '#C193AB' },
  { id: 'dp',         label: 'Dynamic Programming', color: '#79B8AB' },
  { id: 'greedy',     label: 'Greedy',              color: '#C28686' },
  { id: 'bitmanip',   label: 'Bit Manipulation',    color: '#75B5B5' },
  { id: 'sorting',    label: 'Sorting Algorithms',  color: '#A8B3C8' },
  { id: 'range',      label: 'Range Structures',    color: '#A180B3' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
) as Record<CategoryId, DSACategory>
