import { useCallback, useEffect, useState } from 'react'
import { loadNotebook, saveNotebook, type Notebook } from './model'

/** A notebook in localStorage. `create` is used when nothing is stored yet under this id. */
export function useNotebook(id: string, create?: () => Notebook) {
  const [nb, setState] = useState<Notebook | null>(() => loadNotebook(id) ?? (create ? create() : null))
  useEffect(() => { setState(loadNotebook(id) ?? (create ? create() : null)) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const setNb = useCallback((fn: (n: Notebook) => Notebook) => {
    setState((cur) => {
      if (!cur) return cur
      const next = fn(cur)
      if (next !== cur) saveNotebook(next)
      return next
    })
  }, [])
  return [nb, setNb] as const
}
