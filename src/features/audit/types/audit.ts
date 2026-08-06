export interface AuditLog {
  id: string
  actorName: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  createdAt: string
  ipAddress?: string | null
  metadata?: Record<string, unknown> | null
}
