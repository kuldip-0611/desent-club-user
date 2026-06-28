'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'compare_ids'
const UPDATE_EVENT = 'compare-updated'

export const MAX_COMPARE = 3

export function getCompareIds(): string[] {
  if (typeof window === 'undefined') return []
  return (sessionStorage.getItem(STORAGE_KEY) ?? '').split(',').filter(Boolean)
}

export function setCompareIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, ids.join(','))
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function removeCompareId(id: string): void {
  setCompareIds(getCompareIds().filter((existing) => existing !== id))
}

export function clearCompare(): void {
  setCompareIds([])
}

export function useCompareIds(): string[] {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setIds(getCompareIds())
    sync()
    window.addEventListener(UPDATE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return ids
}
