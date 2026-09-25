import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { formatDate } from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type { InviteStaffPayload } from '../types/farm'

const emptyForm: InviteStaffPayload = { mobileNumber: '', name: '' }

export function FarmStaffPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form, setForm] = useState<InviteStaffPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: ['farm', farmId, 'members'],
    queryFn: () => farmApi.members(farmId!),
    enabled: Boolean(farmId),
  })

  const invitationsQuery = useQuery({
    queryKey: ['farm', farmId, 'staff-invitations'],
    queryFn: () => farmApi.staffInvitations(farmId!),
    enabled: Boolean(farmId),
  })

  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey: ['farm', farmId, 'members'] })
  const invalidateInvitations = () =>
    queryClient.invalidateQueries({ queryKey: ['farm', farmId, 'staff-invitations'] })

  const inviteMutation = useMutation({
    mutationFn: (payload: InviteStaffPayload) => farmApi.inviteStaff(farmId!, payload),
    onSuccess: () => {
      void invalidateInvitations()
      void queryClient.invalidateQueries({ queryKey: ['farm', 'dashboard'] })
      setInviteOpen(false)
      setForm(emptyForm)
      setFormError(null)
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const resendMutation = useMutation({
    mutationFn: (id: string) => farmApi.resendStaffInvitation(farmId!, id),
    onSuccess: invalidateInvitations,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => farmApi.cancelStaffInvitation(farmId!, id),
    onSuccess: invalidateInvitations,
  })

  const deactivateMutation = useMutation({
    mutationFn: (memberId: string) => farmApi.deactivateMember(farmId!, memberId),
    onSuccess: invalidateMembers,
  })

  const reactivateMutation = useMutation({
    mutationFn: (memberId: string) => farmApi.reactivateMember(farmId!, memberId),
    onSuccess: invalidateMembers,
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => farmApi.removeMember(farmId!, memberId),
    onSuccess: invalidateMembers,
  })

  if (farmLoading || membersQuery.isLoading) return <LoadingState label={t('loading')} />
  if (membersQuery.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(membersQuery.error as Error).message}
        onRetry={() => void membersQuery.refetch()}
      />
    )
  }

  const staff = (membersQuery.data ?? []).filter((m) => m.memberRole === 'DELIVERY_STAFF')
  const pendingInvitations = (invitationsQuery.data ?? []).filter((i) => i.status === 'PENDING')

  const onInvite = () => {
    if (!form.mobileNumber.trim()) {
      setFormError(t('mobileRequired'))
      return
    }
    inviteMutation.mutate({
      mobileNumber: form.mobileNumber.trim(),
      name: form.name?.trim() || undefined,
    })
  }

  return (
    <Box>
      <PageHeader
        title={t('navDeliveryStaff')}
        subtitle={`${t('invite')} · ${t('manage')}`}
        actions={
          <Button variant="contained" onClick={() => setInviteOpen(true)}>
            {t('invite')} {t('staff')}
          </Button>
        }
      />

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {t('active')} {t('staff')}
      </Typography>
      {staff.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('navDeliveryStaff')}
          action={
            <Button variant="contained" onClick={() => setInviteOpen(true)}>
              {t('invite')} {t('staff')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={2} sx={{ mb: 4 }}>
          {staff.map((member) => (
            <Card key={member.id} variant="outlined">
              <CardActionArea onClick={() => navigate(`/farm/staff/${member.userId}`)}>
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          {member.user?.name ?? t('staff')}
                        </Typography>
                        <StatusChip status={member.status} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {member.user?.mobileNumber ?? '—'} ·{' '}
                        {member.joinedAt ? formatDate(member.joinedAt) : '—'}
                      </Typography>
                      <Typography variant="caption" color="primary.main">
                        {t('openArrow')} · {t('farmAajKiList')}
                      </Typography>
                    </Box>
                    <Typography color="text.secondary">{t('openArrow')}</Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
              <Box sx={{ px: 2, pb: 1.5 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {member.status === 'ACTIVE' ? (
                    <Button
                      size="small"
                      color="warning"
                      onClick={(e) => {
                        e.stopPropagation()
                        deactivateMutation.mutate(member.id)
                      }}
                      disabled={deactivateMutation.isPending}
                    >
                      {t('cancel')}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="success"
                      onClick={(e) => {
                        e.stopPropagation()
                        reactivateMutation.mutate(member.id)
                      }}
                      disabled={reactivateMutation.isPending}
                    >
                      {t('active')}
                    </Button>
                  )}
                  <Button
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`${t('delete')} ${t('staff')}?`)) {
                        removeMutation.mutate(member.id)
                      }
                    }}
                    disabled={removeMutation.isPending}
                  >
                    {t('delete')}
                  </Button>
                </Stack>
              </Box>
            </Card>
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        {t('pending')} {t('invitations')}
      </Typography>
      {invitationsQuery.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : pendingInvitations.length === 0 ? (
        <EmptyState title={t('noData')} />
      ) : (
        <Stack spacing={2}>
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Typography fontWeight={700}>{invitation.name || invitation.mobileNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invitation.mobileNumber} · {t('to')} {formatDate(invitation.expiresAt)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => resendMutation.mutate(invitation.id)}
                      disabled={resendMutation.isPending}
                    >
                      {t('send')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => cancelMutation.mutate(invitation.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {t('cancel')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('invite')} {t('navDeliveryStaff')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label={t('mobileNumber')}
              value={form.mobileNumber}
              onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={`${t('name')} (${t('optional')})`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={onInvite} disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? t('loading') : `${t('send')} ${t('invite')}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
