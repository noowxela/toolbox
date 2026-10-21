import { useEffect, useRef, useState } from 'react'
import { copyText } from '../copy.ts'

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  async function copy(text: string, id = 'default') {
    const ok = await copyText(text)
    if (!ok) return false
    setCopied(id)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setCopied(null)
      timer.current = null
    }, 2000)
    return true
  }

  return { copied, copy }
}
