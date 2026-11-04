import type { ReactNode } from 'react'

type Props = {
  icon?: string
  title: string
  text?: string
  meta?: ReactNode
  cta?: string
  onAction?: () => void
}

export default function ServiceCard({ icon, title, text, meta, cta = 'Use this', onAction }: Props) {
  return (
    <article className="card">
      {icon && (
        <span className="card-icon" aria-hidden>
          {icon}
        </span>
      )}
      <h3 className="card-title">{title}</h3>
      {text && <p className="card-text">{text}</p>}
      {meta && <p className="card-meta">{meta}</p>}
      {onAction && (
        <button className="card-action" type="button" onClick={onAction}>
          {cta}
          <span aria-hidden>→</span>
        </button>
      )}
    </article>
  )
}
