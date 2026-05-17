import { CATEGORY_MAP, type CategoryId } from '@/data/categories'

export function categoryColor(id: CategoryId | string): string {
  return CATEGORY_MAP[id as CategoryId]?.color ?? '#808080'
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
