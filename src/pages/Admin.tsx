import { useMemo, useState, type FormEvent } from 'react'
import { money, uid } from '../lib/format'
import { useStore } from '../lib/store'

type CollectionKey = 'services' | 'loans' | 'funds' | 'blogs' | 'notes'
type TabKey = CollectionKey | 'site' | 'msgs' | 'users'
type Row = { id: string; [key: string]: string | number }
type Field = { key: string; label: string; type?: 'text' | 'number' | 'date' | 'area' }

const COLLECTIONS: Record<CollectionKey, { title: string; fields: Field[] }> = {
  services: {
    title: 'Services',
    fields: [
      { key: 'cat', label: 'Category' },
      { key: 'icon', label: 'Icon (emoji)' },
      { key: 'name', label: 'Name' },
      { key: 'desc', label: 'Description' },
    ],
  },
  loans: {
    title: 'Loans',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'icon', label: 'Icon (emoji)' },
      { key: 'rate', label: 'Interest % p.a.', type: 'number' },
      { key: 'max', label: 'Max amount ₹', type: 'number' },
      { key: 'desc', label: 'Description' },
    ],
  },
  funds: {
    title: 'Mutual funds',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'cat', label: 'Category' },
      { key: 'nav', label: 'NAV ₹', type: 'number' },
      { key: 'r1', label: '1-year return %', type: 'number' },
      { key: 'risk', label: 'Risk' },
    ],
  },
  blogs: {
    title: 'Blog posts',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'body', label: 'Content', type: 'area' },
    ],
  },
  notes: {
    title: 'Notifications',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Message', type: 'area' },
      { key: 'date', label: 'Date', type: 'date' },
    ],
  },
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'site', label: 'Site settings' },
  { key: 'services', label: 'Services' },
  { key: 'loans', label: 'Loans' },
  { key: 'funds', label: 'Mutual funds' },
  { key: 'blogs', label: 'Blog posts' },
  { key: 'notes', label: 'Notifications' },
  { key: 'msgs', label: 'Messages' },
  { key: 'users', label: 'Users' },
]

export default function Admin() {
  const { db } = useStore()
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<TabKey>('site')

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />
  }

  return (
    <>
      <h1>Admin</h1>
      <p className="lead">
        Content is stored in this browser only. Password: <code>{'admin123'}</code> until you change
        it in site settings.
      </p>

      <div className="admin">
        <aside className="admin-nav">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? 'active' : ''}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className="signout"
            onClick={() => {
              setAuthed(false)
              setTab('site')
            }}
          >
            Sign out
          </button>
        </aside>

        <div className="admin-body">
          {tab === 'site' && <SiteSettings />}
          {tab === 'msgs' && <MessagesPanel />}
          {tab === 'users' && <UsersPanel />}
          {tab !== 'site' && tab !== 'msgs' && tab !== 'users' && (
            <CollectionPanel key={tab} name={tab} />
          )}
        </div>
      </div>
      <p className="muted small">
        {db.site.name} · admin panel · demo data lives in localStorage
      </p>
    </>
  )
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { db } = useStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password === db.site.apw) {
      setError('')
      onSuccess()
      return
    }
    setError('Wrong password.')
  }

  return (
    <form className="auth-box" onSubmit={submit}>
      <h1>Admin login</h1>
      <label className="field">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <p className="error">{error}</p>
      <button className="btn" type="submit" style={{ width: '100%' }}>
        Sign in
      </button>
      <p className="muted small" style={{ marginTop: 12 }}>
        Demo password: admin123. Change it under Site settings after signing in.
      </p>
    </form>
  )
}

function SiteSettings() {
  const { db, update, notify } = useStore()
  const [form, setForm] = useState({
    name: db.site.name,
    tag: db.site.tag,
    letter: db.site.letter,
    color: db.site.color,
    phone: db.site.phone,
    email: db.site.email,
    addr: db.site.addr,
    apw: db.site.apw,
    about: db.site.about,
  })

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.name.trim().length < 2) {
      notify('Site name is too short')
      return
    }
    if (form.apw.length < 6) {
      notify('Admin password needs 6 or more characters')
      return
    }
    if (!/^#[0-9a-f]{6}$/i.test(form.color)) {
      notify('Pick a valid brand colour')
      return
    }
    update((draft) => {
      draft.site = { ...draft.site, ...form, name: form.name.trim(), letter: form.letter.slice(0, 2) }
    })
    notify('Settings saved')
  }

  function uploadLogo(file: File | undefined) {
    if (!file) return
    if (file.size > 300_000) {
      notify('Use an image under 300 KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      update((draft) => {
        draft.site.logo = String(reader.result ?? '')
      })
      notify('Logo updated')
    }
    reader.readAsDataURL(file)
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>Site settings</h2>

      <label className="field">
        Site name
        <input value={form.name} onChange={(event) => set('name', event.target.value)} required />
      </label>
      <label className="field">
        Home tagline
        <input value={form.tag} onChange={(event) => set('tag', event.target.value)} />
      </label>
      <div className="two">
        <label className="field">
          Logo letter
          <input value={form.letter} onChange={(event) => set('letter', event.target.value)} />
        </label>
        <label className="field">
          Brand colour
          <input
            type="color"
            value={form.color}
            onChange={(event) => set('color', event.target.value)}
          />
        </label>
      </div>
      <div className="two">
        <label className="field">
          Phone
          <input value={form.phone} onChange={(event) => set('phone', event.target.value)} />
        </label>
        <label className="field">
          Email
          <input value={form.email} onChange={(event) => set('email', event.target.value)} />
        </label>
      </div>
      <label className="field">
        Address
        <input value={form.addr} onChange={(event) => set('addr', event.target.value)} />
      </label>
      <label className="field">
        Admin password
        <input value={form.apw} onChange={(event) => set('apw', event.target.value)} />
      </label>
      <label className="field">
        About us text
        <textarea
          rows={5}
          value={form.about}
          onChange={(event) => set('about', event.target.value)}
        />
      </label>

      <label className="field">
        Logo image (optional, under 300 KB)
        <input
          type="file"
          accept="image/*"
          onChange={(event) => uploadLogo(event.target.files?.[0])}
        />
      </label>

      {db.site.logo && (
        <div className="inline-actions">
          <img
            src={db.site.logo}
            alt="Current logo"
            style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
          />
          <button
            className="link-btn"
            type="button"
            onClick={() => {
              update((draft) => {
                draft.site.logo = ''
              })
              notify('Logo removed')
            }}
          >
            Remove logo image
          </button>
        </div>
      )}

      <div className="btn-row">
        <button className="btn" type="submit">
          Save settings
        </button>
      </div>
    </form>
  )
}

function CollectionPanel({ name }: { name: CollectionKey }) {
  const { db, update, notify } = useStore()
  const config = COLLECTIONS[name]
  const rows = db[name] as unknown as Row[]
  const [editing, setEditing] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  const emptyValues = useMemo(
    () => Object.fromEntries(config.fields.map((field) => [field.key, ''])),
    [config],
  )

  function reset() {
    setEditing(null)
    setValues(emptyValues)
  }

  function startEdit(row: Row) {
    setEditing(row.id)
    setValues(
      Object.fromEntries(config.fields.map((field) => [field.key, String(row[field.key] ?? '')])),
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const first = config.fields[0]
    if (!(values[first.key] ?? '').trim()) {
      notify(`Add a ${first.label.toLowerCase()} first`)
      return
    }

    const target: Row = { id: editing ?? uid() }
    for (const field of config.fields) {
      const raw = values[field.key] ?? ''
      target[field.key] = field.type === 'number' ? Number(raw) || 0 : raw
    }

    update((draft) => {
      const list = draft[name] as unknown as Row[]
      const index = list.findIndex((row) => row.id === target.id)
      if (index >= 0) list[index] = target
      else list.unshift(target)
    })
    notify(editing ? 'Changes saved' : 'Added')
    reset()
  }

  function remove(id: string) {
    update((draft) => {
      const list = draft[name] as unknown as Row[]
      const index = list.findIndex((row) => row.id === id)
      if (index >= 0) list.splice(index, 1)
    })
    if (editing === id) reset()
    notify('Deleted')
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>
        {config.title} <span className="badge-soft">{rows.length}</span>
      </h2>

      <form className="panel" onSubmit={submit}>
        {config.fields.map((field) =>
          field.type === 'area' ? (
            <label className="field" key={field.key}>
              {field.label}
              <textarea
                rows={4}
                value={values[field.key] ?? ''}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
              />
            </label>
          ) : (
            <label className="field" key={field.key}>
              {field.label}
              <input
                type={field.type ?? 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                value={values[field.key] ?? ''}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
              />
            </label>
          ),
        )}

        <div className="btn-row">
          <button className="btn" type="submit">
            {editing ? 'Save changes' : 'Add new'}
          </button>
          {editing && (
            <button className="link-btn" type="button" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="muted">Nothing here yet.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="wrap">
                  {String(row.icon ?? '')} {String(row.name ?? row.title ?? '')}
                  {name === 'loans' && (
                    <span className="muted"> · {money(Number(row.max))} max</span>
                  )}
                </td>
                <td>
                  <button className="link-btn" type="button" onClick={() => startEdit(row)}>
                    Edit
                  </button>{' '}
                  <button className="link-btn" type="button" onClick={() => remove(row.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function MessagesPanel() {
  const { db, update, notify } = useStore()

  function remove(id: string) {
    update((draft) => {
      const index = draft.msgs.findIndex((message) => message.id === id)
      if (index >= 0) draft.msgs.splice(index, 1)
    })
    notify('Message deleted')
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>
        Messages <span className="badge-soft">{db.msgs.length}</span>
      </h2>
      <div className="table-wrap">
        <table>
          <tbody>
            {db.msgs.length === 0 && (
              <tr>
                <td className="muted">No messages yet.</td>
              </tr>
            )}
            {db.msgs.map((message) => (
              <tr key={message.id}>
                <td className="wrap">
                  <strong>{message.name}</strong>
                  <br />
                  <span className="muted small">
                    {message.contact} · {message.date}
                  </span>
                </td>
                <td className="wrap">{message.msg}</td>
                <td>
                  <button className="link-btn" type="button" onClick={() => remove(message.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function UsersPanel() {
  const { db, update, notify } = useStore()

  function remove(id: string) {
    update((draft) => {
      const index = draft.users.findIndex((user) => user.id === id)
      if (index >= 0) draft.users.splice(index, 1)
    })
    notify('User removed')
  }

  return (
    <>
      <h2 style={{ marginTop: 0 }}>
        Users <span className="badge-soft">{db.users.length}</span>
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {db.users.length === 0 && (
              <tr>
                <td className="muted" colSpan={4}>
                  No registered users yet.
                </td>
              </tr>
            )}
            {db.users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.mobile}</td>
                <td>{user.email}</td>
                <td>
                  <button className="link-btn" type="button" onClick={() => remove(user.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Demo accounts are stored in this browser. Password hashes are not real security — move auth
        to a server before launch.
      </p>
    </>
  )
}
