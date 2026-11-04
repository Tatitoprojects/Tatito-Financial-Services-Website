import { useNavigate } from 'react-router-dom'
import { useStore } from './store'

/**
 * Demo action handler: unauthenticated visitors are sent to the login page,
 * signed-in visitors get a confirmation toast (no backend yet).
 */
export function useRequestAction() {
  const { me, notify } = useStore()
  const navigate = useNavigate()

  return (label: string) => {
    if (!me) {
      notify('Please log in to continue')
      navigate('/login')
      return
    }
    notify(`${label}: request received (demo)`)
  }
}
