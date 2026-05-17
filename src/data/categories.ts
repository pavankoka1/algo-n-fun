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
  { id: 'array',      label: 'Array',               color: '#00E5FF' },
  { id: 'string',     label: 'String',              color: '#4DFFB4' },
  { id: 'hashmap',    label: 'Hash Map',             color: '#FFD700' },
  { id: 'stack',      label: 'Stack',               color: '#FF6B6B' },
  { id: 'queue',      label: 'Queue / Deque',       color: '#A78BFA' },
  { id: 'linkedlist', label: 'Linked List',         color: '#60CFFF' },
  { id: 'trees',      label: 'Trees',               color: '#34D399' },
  { id: 'recursion',  label: 'Recursion',           color: '#FB923C' },
  { id: 'heap',       label: 'Heap',                color: '#F59E0B' },
  { id: 'graphs',     label: 'Graphs',              color: '#818CF8' },
  { id: 'trie',       label: 'Trie',                color: '#EC4899' },
  { id: 'dp',         label: 'Dynamic Programming', color: '#6EE7B7' },
  { id: 'greedy',     label: 'Greedy',              color: '#FCA5A5' },
  { id: 'bitmanip',   label: 'Bit Manipulation',    color: '#22D3EE' },
  { id: 'sorting',    label: 'Sorting Algorithms',  color: '#CBD5E1' },
  { id: 'range',      label: 'Range Structures',    color: '#7C3AED' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
) as Record<CategoryId, DSACategory>
