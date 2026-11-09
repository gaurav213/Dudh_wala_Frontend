import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined'
import { Badge, IconButton, Menu, MenuItem, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { resolveNotificationCopy } from '../../i18n/notificationCatalogs'
import { notificationsApi } from '../../features/notifications/api/notificationsApi'

/** Bell on every signed-in page, not only the home screen. */
export function NotificationBell({ extraCount = 0 }: { extraCount?: number }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.unreadCount()).count,
    refetchInterval: 20_000,
  })
  const listQuery = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => notificationsApi.list({ limit: 8 }),
    enabled: Boolean(anchor),
  })
  const unread = unreadQuery.data ?? 0
  const count = Math.max(unread, extraCount)
  const items = listQuery.data ?? []

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={t('notifications')}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Badge badgeContent={count} color="error" invisible={count === 0}>
          <NotificationsOutlined />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {items.length === 0 ? (
          <MenuItem disabled>{t('noNotifications')}</MenuItem>
        ) : (
          items.map((item) => {
            const data = (item.notification?.data ?? {}) as Record<string, unknown>
            const params = data.params as
              | Record<string, string | number | null | undefined>
              | undefined
            const copy = resolveNotificationCopy(
              i18n.language,
              typeof data.messageKey === 'string' ? data.messageKey : undefined,
              params,
              {
                title: item.notification?.title ?? '',
                body: item.notification?.body ?? '',
              },
              item.notification?.type,
            )
            const route = item.notification?.route
            return (
              <MenuItem
                key={item.recipientId}
                onClick={() => {
                  setAnchor(null)
                  if (route && route.startsWith('/')) navigate(route)
                }}
                sx={{ maxWidth: 360, whiteSpace: 'normal' }}
              >
                <Typography variant="body2">{copy.title || copy.body}</Typography>
              </MenuItem>
            )
          })
        )}
      </Menu>
    </>
  )
}
