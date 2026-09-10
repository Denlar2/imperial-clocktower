import { useEffect, useState } from 'react'

// Tiny hash router: "#/st/42" → "/st/42". Hash routing works on GitHub Pages without a 404 fallback.
export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '')
  return h.startsWith('/') ? h : '/'
}

export function navigate(path: string, replace = false) {
  const target = '#' + path
  if (replace) window.location.replace(target)
  else window.location.hash = path
}

export function usePath(): string {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const on = () => setPath(currentPath())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

/** Absolute URL for a hash path — for share links. */
export function absoluteUrl(path: string): string {
  const base = window.location.href.split('#')[0]
  return base + '#' + path
}
