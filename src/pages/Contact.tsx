import { useState, type FormEvent } from 'react'
import { uid } from '../lib/format'
import { useStore } from '../lib/store'

export default function Contact() {
  const { db, update, notify } = useStore()
  const [values, setValues] = useState({ name: '', contact: '', msg: '' })
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (values.name.trim().length < 2) {
      setError('Please enter your name.')
      return
    }
    if (values.contact.trim().length < 5) {
      setError('Add a mobile number or email so we can reply.')
      return
    }
    if (values.msg.trim().length < 5) {
      setError('Tell us a little more about what you need.')
      return
    }
    setError('')
    update((draft) => {
      draft.msgs.unshift({
        id: uid(),
        name: values.name.trim(),
        contact: values.contact.trim(),
        msg: values.msg.trim(),
        date: new Date().toLocaleString('en-IN'),
      })
    })
    setValues({ name: '', contact: '', msg: '' })
    notify('Message sent. We will reply soon.')
  }

  return (
    <>
      <h1>Contact us</h1>
      <div className="two">
        <div className="panel">
          <h3 className="card-title">Reach the team</h3>
          <p className="muted">{db.site.addr}</p>
          <p>
            <a className="link-btn" href={`tel:${db.site.phone.replace(/\s/g, '')}`}>
              {db.site.phone}
            </a>
          </p>
          <p>
            <a className="link-btn" href={`mailto:${db.site.email}`}>
              {db.site.email}
            </a>
          </p>
          <p className="muted small">
            Support hours: Monday to Saturday, 9:30 am to 6:30 pm IST.
          </p>
        </div>

        <form className="panel" onSubmit={submit} noValidate>
          <label className="field">
            Name
            <input
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
              required
            />
          </label>
          <label className="field">
            Mobile or email
            <input
              value={values.contact}
              onChange={(event) => setValues({ ...values, contact: event.target.value })}
              required
            />
          </label>
          <label className="field">
            Message
            <textarea
              rows={4}
              value={values.msg}
              onChange={(event) => setValues({ ...values, msg: event.target.value })}
              required
            />
          </label>
          <p className="error">{error}</p>
          <button className="btn" type="submit">
            Send message
          </button>
        </form>
      </div>
    </>
  )
}
