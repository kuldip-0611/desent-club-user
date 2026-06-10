import { useCallback } from 'react'

const KEY = 'desent_recently_viewed'
const MAX = 10

export type RecentItem = { slug: string; addedAt: number }

function readItems(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RecentItem[]
  } catch {
    return []
  }
}

function writeItems(items: RecentItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function useRecentlyViewed() {
  const addViewed = useCallback((slug: string) => {
    const items = readItems().filter((i) => i.slug !== slug)
    items.unshift({ slug, addedAt: Date.now() })
    writeItems(items.slice(0, MAX))
  }, [])

  const getViewed = useCallback((): string[] => {
    return readItems().map((i) => i.slug)
  }, [])

  return { addViewed, getViewed }
}
