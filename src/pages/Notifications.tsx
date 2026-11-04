import { formatDate } from '../lib/format'
import { useStore } from '../lib/store'

export default function Notifications() {
  const { db } = useStore()
  const notes = [...db.notes].reverse()

  return (
    <>
      <h1>Notifications</h1>
      <p className="lead">Announcements published from the admin panel.</p>

      {notes.length === 0 ? (
        <p className="muted">You are all caught up.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {notes.map((note) => (
            <article className="card" key={note.id}>
              <h3 className="card-title">{note.title}</h3>
              <p className="card-text">{note.body}</p>
              <p className="card-meta">{formatDate(note.date)}</p>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
