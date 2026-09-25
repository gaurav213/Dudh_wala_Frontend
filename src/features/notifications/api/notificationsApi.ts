import { apiGet } from '../../../lib/api/client'

export interface InboxNotification {
  recipientId: string
  readAt?: string | null
  notification?: {
    type?: string
    title?: string
    body?: string
    route?: string | null
    data?: Record<string, unknown>
  }
}

export const notificationsApi = {
  unreadCount() {
    return apiGet<{ count: number }>('/notifications/unread-count')
  },
  list(params?: { limit?: number }) {
    return apiGet<InboxNotification[]>('/notifications', params)
  },
}
