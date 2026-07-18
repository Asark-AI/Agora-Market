'use client'
 
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePageLoaderStore } from '@/hooks/use-page-loader'
 
export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { hide } = usePageLoaderStore()
 
  useEffect(() => {
    hide()
  }, [pathname, searchParams, hide])
 
  return null
}
