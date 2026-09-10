import { SCRIPTS } from '../data/characters'
import { deleteNotebook, listNotebooks, newNotebook, uid } from '../notes/model'
import { useNotebook } from '../notes/useNotebook'
import { navigate } from '../lib/router'
import Notebook from './notes/Notebook'
import Setup from './notes/Setup'
import { Button, Card, Empty, Footer, Page } from './kit'

/** #/notes — list of notebooks on this phone; #/notes/<id> — one notebook. */
export default function NotesHome({ id }: { id?: string }) {
  if (id) return <NotebookPage id={id} />
  const books = listNotebooks()
  return (
    <Page title="Notetaking" back="/">
      <p className="mb-4 text-dim">Your private notes for a game: who claims what, who voted how, who you trust. Stays on this phone.</p>
      <Button big variant="primary" className="w-full" onClick={() => navigate(`/notes/${uid()}`)}>New notebook</Button>
      {books.length === 0 ? (
        <Empty>No notebooks yet.</Empty>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {books.map((b) => (
            <Card key={b.id} className="flex items-center gap-2">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`/notes/${b.id}`)}>
                <div className="display truncate text-lg">{b.title || SCRIPTS[b.script].name}</div>
                <div className="text-sm text-dim">{SCRIPTS[b.script].name} · {b.players.length} players · {new Date(b.updatedAt).toLocaleString()}</div>
              </button>
              <Button variant="danger" onClick={() => { if (confirm('Delete this notebook?')) { deleteNotebook(b.id); navigate('/notes', true); window.dispatchEvent(new HashChangeEvent('hashchange')) } }}>Delete</Button>
            </Card>
          ))}
        </div>
      )}
      <Footer />
    </Page>
  )
}

function NotebookPage({ id }: { id: string }) {
  const [nb, setNb] = useNotebook(id, () => newNotebook(id, 'TB'))
  if (!nb) return null
  if (!nb.ready) return <Setup nb={nb} setNb={setNb} onDone={() => setNb((n) => ({ ...n, ready: true }))} onBack={() => navigate('/notes')} />
  return (
    <Notebook
      nb={nb}
      setNb={setNb}
      back="/notes"
      right={<span className="truncate text-sm text-dim">{nb.title || SCRIPTS[nb.script].name}</span>}
      onDelete={() => { if (confirm('Delete this notebook?')) { deleteNotebook(id); navigate('/notes') } }}
    />
  )
}
