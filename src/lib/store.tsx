import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seed, type DB, type User } from './seed'

const DB_KEY = 'tatito_site_v2'
const SESSION_KEY = 'tatito_session_v1'

type Session = { name: string } | null

type Store = {
  db: DB
  me: Session
  update: (mutate: (draft: DB) => void) => void
  replace: (next: DB) => void
  notify: (message: string) => void
  signIn: (user: User) => void
  signOut: () => void
}

const StoreContext = createContext<Store | null>(null)

function readDb(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<DB>
    return { ...seed, ...parsed, site: { ...seed.site, ...(parsed.site ?? {}) } }
  } catch {
    return seed
  }
}

function readSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(readDb)
  const [me, setMe] = useState<Session>(readSession)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const persist = useCallback((next: DB) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(next))
    } catch {
      setToast('Could not save: browser storage is full')
    }
  }, [])

  const update = useCallback(
    (mutate: (draft: DB) => void) => {
      setDb((current) => {
        const draft = structuredClone(current)
        mutate(draft)
        persist(draft)
        return draft
      })
    },
    [persist],
  )

  const replace = useCallback(
    (next: DB) => {
      setDb(next)
      persist(next)
    },
    [persist],
  )

  const notify = useCallback((message: string) => setToast(message), [])

  const signIn = useCallback((user: User) => {
    const session = { name: user.name }
    setMe(session)
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      /* storage is optional for the session */
    }
  }, [])

  const signOut = useCallback(() => {
    setMe(null)
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const accent = db.site.color
    if (/^#[0-9a-f]{6}$/i.test(accent)) {
      document.documentElement.style.setProperty('--accent', accent)
      document.documentElement.style.setProperty('--brand', accent)
    }
    document.title = db.site.name
  }, [db.site.color, db.site.name])

  const value = useMemo<Store>(
    () => ({ db, me, update, replace, notify, signIn, signOut }),
    [db, me, update, replace, notify, signIn, signOut],
  )

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className={`toast${toast ? ' toast-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </StoreContext.Provider>
  )
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
