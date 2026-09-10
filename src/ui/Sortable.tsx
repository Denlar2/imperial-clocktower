import { useRef, type ReactNode } from 'react'

/**
 * Touch-friendly reorderable list. Drag by the handle (pointer events, works on iOS Safari).
 * Calls onMove(from, to) live while dragging.
 */
export function Sortable<T extends { id: string }>({ items, onMove, render }: { items: T[]; onMove: (from: number, to: number) => void; render: (item: T, i: number, handle: ReactNode) => ReactNode }) {
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const drag = useRef<{ index: number } | null>(null)

  function onPointerDown(e: React.PointerEvent, index: number) {
    drag.current = { index }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    rows.current[index]?.classList.add('opacity-60', 'scale-[1.02]')
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const y = e.clientY
    let to = drag.current.index
    rows.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      if (i < drag.current!.index && y < r.top + r.height / 2) to = Math.min(to, i)
      if (i > drag.current!.index && y > r.top + r.height / 2) to = Math.max(to, i)
    })
    if (to !== drag.current.index) {
      const from = drag.current.index
      rows.current[from]?.classList.remove('opacity-60', 'scale-[1.02]')
      drag.current.index = to
      onMove(from, to)
      requestAnimationFrame(() => rows.current[to]?.classList.add('opacity-60', 'scale-[1.02]'))
    }
  }
  function onPointerUp() {
    if (drag.current) rows.current[drag.current.index]?.classList.remove('opacity-60', 'scale-[1.02]')
    drag.current = null
  }

  return (
    <ol className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={it.id} ref={(el) => { rows.current[i] = el }} className="transition-transform">
          {render(it, i, (
            <span
              role="button"
              aria-label="Drag to reorder"
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="flex min-h-11 min-w-11 cursor-grab items-center justify-center text-2xl text-dim select-none"
              style={{ touchAction: 'none' }}
            >
              ⋮⋮
            </span>
          ))}
        </li>
      ))}
    </ol>
  )
}
