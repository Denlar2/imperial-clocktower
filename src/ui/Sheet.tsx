import { SCRIPTS, TYPES, charsOfType, getScript } from '../data/characters'
import { absoluteUrl, navigate } from '../lib/router'
import { Button, Card, Footer, Page, Toast, alignClass, copyText, useToast } from './kit'

export default function Sheet({ scriptId }: { scriptId?: string }) {
  const S = getScript(scriptId)
  const [toast, say] = useToast()
  if (!S) {
    return (
      <Page title="Character sheets" back="/">
        {Object.values(SCRIPTS).map((s) => (
          <Button key={s.id} big className="mb-2 w-full" onClick={() => navigate(`/sheet/${s.id}`)}>{s.name}</Button>
        ))}
        <Footer />
      </Page>
    )
  }
  const share = async () => say((await copyText(absoluteUrl(`/sheet/${S.id}`))) ? 'Link copied' : 'Could not copy')
  return (
    <Page
      title={S.name}
      back={() => (window.history.length > 1 ? window.history.back() : navigate('/'))}
      right={<Button variant="ghost" onClick={share} aria-label="Copy link">Share</Button>}
    >
      <Toast msg={toast} />
      {TYPES.map((t) => (
        <section key={t} className="mb-6">
          <h2 className={`mb-2 text-2xl ${alignClass(t === 'Minion' || t === 'Demon')}`}>{t}</h2>
          <div className="flex flex-col gap-2">
            {charsOfType(S, t).map((c) => (
              <Card key={c.name}>
                <div className="display text-lg">{c.name}</div>
                <div className="text-sm text-dim">{c.ability}</div>
              </Card>
            ))}
          </div>
        </section>
      ))}
      {S.jinx && (
        <section className="mb-6">
          <h2 className="mb-2 text-2xl text-candle">Djinn — special rules</h2>
          <Card className="text-sm text-dim">
            {S.jinx.map((j) => <p key={j} className="mb-1 last:mb-0">{j}</p>)}
          </Card>
        </section>
      )}
      <section className="mb-6">
        <h2 className="mb-2 text-2xl text-candle">Night order</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="mb-1 font-semibold">First night</div>
            <ol className="list-decimal pl-5 text-sm text-dim">{S.firstNight.map((n, i) => <li key={i}>{n}</li>)}</ol>
          </Card>
          <Card>
            <div className="mb-1 font-semibold">Other nights</div>
            <ol className="list-decimal pl-5 text-sm text-dim">{S.otherNight.map((n, i) => <li key={i}>{n}</li>)}</ol>
          </Card>
        </div>
      </section>
      <Footer />
    </Page>
  )
}
