import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/auth/useAuth'
import { notificationsApi } from '../../features/notifications/api/notificationsApi'
import { resolveNotificationCopy } from '../../i18n/notificationCatalogs'

const SEEN_KEY = 'dk_notif_seen_v1'

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveSeen(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)))
}

/**
 * Free browser alerts: poll inbox + optional Notification API (no Firebase).
 * ponytail: tab must be open; Service Worker push later if killed-tab needed.
 */
export function InboxNotificationPoller() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { i18n } = useTranslation()
  const seenRef = useRef<Set<string>>(loadSeen())
  const permissionAsked = useRef(false)

  const query = useQuery({
    queryKey: ['notifications', 'poll'],
    queryFn: () => notificationsApi.list({ limit: 20 }),
    enabled: Boolean(user),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!user || !query.data) return
    const fresh = query.data.filter(
      (n) => !n.readAt && n.recipientId && !seenRef.current.has(n.recipientId),
    )
    if (!fresh.length) return

    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void queryClient.invalidateQueries({ queryKey: ['farm', 'dashboard'] })

    if (typeof Notification !== 'undefined' && Notification.permission === 'default' && !permissionAsked.current) {
      permissionAsked.current = true
      void Notification.requestPermission()
    }

    for (const n of fresh) {
      seenRef.current.add(n.recipientId)
      const data = (n.notification?.data ?? {}) as Record<string, unknown>
      const params = (data.params as Record<string, string | number | null | undefined> | undefined)
      const copy = resolveNotificationCopy(
        i18n.language,
        typeof data.messageKey === 'string' ? data.messageKey : undefined,
        params,
        {
          title: n.notification?.title ?? 'Doodh Wala',
          body: n.notification?.body ?? '',
        },
        n.notification?.type,
      )
      const route = n.notification?.route
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const note = new Notification(copy.title, { body: copy.body })
        if (route) {
          note.onclick = () => {
            window.focus()
            window.location.assign(route)
          }
        }
      }
    }
    saveSeen(seenRef.current)
  }, [query.data, queryClient, user, i18n.language])

  return null
}
