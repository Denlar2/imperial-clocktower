import { getChar, getScript } from '../data/characters'
import type { Reveal } from '../game/types'
import { cx } from './kit'

/**
 * Full-screen role token. Tap anywhere to hide. The hidden state is deliberately loud so it is
 * obvious when the phone is safe to put down or show around.
 */
export default function RoleReveal({ reveal, scriptId, name, shown, onToggle }: { reveal: Reveal; scriptId: string; name: string; shown: boolean; onToggle: () => void }) {
  const S = getScript(scriptId)
  const c = S ? getChar(S, reveal.shown) : undefined
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide your role' : 'Show your role'}
      className="fixed inset-0 z-30 flex w-full flex-col items-center justify-center bg-night px-7 text-center"
    >
      {shown ? (
        <div key="on" className="flip-in flex flex-col items-center">
          <div className="text-dim">{name}</div>
          <div className={cx('display mt-2 text-5xl leading-tight', reveal.evil ? 'text-evil' : 'text-good')}>{reveal.shown}</div>
          <div className={cx('mt-2 text-lg', reveal.evil ? 'text-evil' : 'text-good')}>
            {reveal.type} · {reveal.evil ? 'Evil' : 'Good'}
          </div>
          <p className="mt-5 max-w-[34ch] text-wax">{c?.ability}</p>
          {reveal.mates && <p className="mt-4 max-w-[34ch] text-evil">{reveal.mates}</p>}
          <div className="mt-10 rounded-full border border-line px-5 py-2 text-dim">Tap to hide</div>
        </div>
      ) : (
        <div key="off" className="fade-in flex flex-col items-center">
          <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-candle/60 bg-dusk shadow-[0_0_60px_rgba(230,182,74,.15)]">
            <span className="display text-2xl text-candle">Hidden</span>
          </div>
          <div className="mt-8 text-dim">{name}</div>
          <div className="display mt-1 text-2xl">Your role is hidden</div>
          <div className="mt-10 rounded-full bg-candle px-6 py-3 font-semibold text-night">Tap to reveal</div>
        </div>
      )}
    </button>
  )
}
