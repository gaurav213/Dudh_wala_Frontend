import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { refreshQueries } from '../../../lib/query/refreshQueries'
import { farmApi, type CreateDairyPaymentPayload, type CreateDairySlipPayload, type DairyPayment } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'

function todayIso() {
  const n = new Date()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${n.getFullYear()}-${m}-${d}`
}

function monthKey() {
  return todayIso().slice(0, 7)
}

function slipAmount(litres: string, rate: string) {
  const l = Number(litres)
  const r = Number(rate)
  if (!Number.isFinite(l) || !Number.isFinite(r)) return ''
  return (Math.round(l * r * 100) / 100).toFixed(2)
}

function messageOf(error: unknown) {
  return isApiError(error) ? error.message : 'Could not save'
}

export function FarmDairySalesPage() {
  const queryClient = useQueryClient()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const month = monthKey()
  const [slipOpen, setSlipOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<DairyPayment | null>(null)
  const [error, setError] = useState<string | null>(null)

  const summary = useQuery({
    queryKey: ['farm', farmId, 'dairy-summary', month],
    queryFn: () => farmApi.dairySummary(farmId!, month),
    enabled: Boolean(farmId),
  })
  const slips = useQuery({
    queryKey: ['farm', farmId, 'dairy-slips', month],
    queryFn: () => farmApi.dairySlips(farmId!, month),
    enabled: Boolean(farmId),
  })
  const payments = useQuery({
    queryKey: ['farm', farmId, 'dairy-payments', month],
    queryFn: () => farmApi.dairyPayments(farmId!, month),
    enabled: Boolean(farmId),
  })

  async function afterSave() {
    setError(null)
    await refreshQueries(queryClient, [
      ['farm', farmId, 'dairy-summary', month],
      ['farm', farmId, 'dairy-slips', month],
      ['farm', farmId, 'dairy-payments', month],
    ])
  }

  const saveSlip = useMutation({
    mutationFn: (payload: CreateDairySlipPayload) => farmApi.createDairySlip(farmId!, payload),
    onSuccess: async () => {
      setSlipOpen(false)
      await afterSave()
    },
    onError: (e) => setError(messageOf(e)),
  })
  const savePayment = useMutation({
    mutationFn: (payload: CreateDairyPaymentPayload) => farmApi.createDairyPayment(farmId!, payload),
    onSuccess: async () => {
      setPayOpen(false)
      await afterSave()
    },
    onError: (e) => setError(messageOf(e)),
  })

  if (farmLoading || summary.isLoading || slips.isLoading || payments.isLoading) return <LoadingState />
  if (summary.isError || slips.isError || payments.isError) {
    return <ErrorState message="Could not load dairy sales." onRetry={() => void afterSave()} />
  }

  const totals = summary.data
  return (
    <Box>
      <PageHeader
        title="Dairy sales"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setPayOpen(true)} disabled={savePayment.isPending}>
              Payment received
            </Button>
            <Button variant="contained" onClick={() => setSlipOpen(true)} disabled={saveSlip.isPending}>
              Add slip
            </Button>
          </Stack>
        }
      />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Stat label="Sold today" value={totals?.todaySold} />
        <Stat label="Sold this month" value={totals?.monthSold} />
        <Stat label="Received" value={totals?.monthReceived} />
        <Stat label="Due" value={totals?.monthDue} />
      </Stack>
      {(totals?.dairies ?? []).map((d) => (
        <Typography key={d.dairyName} sx={{ mb: 0.5 }}>
          {d.dairyName}: sold {d.sold}, received {d.received}, due {d.due}
        </Typography>
      ))}
      {(slips.data ?? []).map((slip) => (
        <Typography key={slip.id} sx={{ py: 0.5 }}>
          {slip.slipDate} · {slip.dairyName} · {slip.litres} L × {slip.rate} = ₹{slip.amount}
        </Typography>
      ))}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Payment received</Typography>
      {(payments.data ?? []).length === 0 ? (
        <Typography color="text.secondary">No payments this month yet.</Typography>
      ) : (
        (payments.data ?? []).map((payment) => (
          <Button
            key={payment.id}
            onClick={() => setSelectedPayment(payment)}
            sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
          >
            <span>{payment.paidOn} · {payment.dairyName}</span>
            <span>₹{payment.amount}</span>
          </Button>
        ))
      )}
      <SlipDialog
        open={slipOpen}
        busy={saveSlip.isPending}
        onClose={() => setSlipOpen(false)}
        onSave={(payload) => saveSlip.mutate(payload)}
      />
      <PaymentDialog
        open={payOpen}
        busy={savePayment.isPending}
        onClose={() => setPayOpen(false)}
        onSave={(payload) => savePayment.mutate(payload)}
      />
      <Dialog open={selectedPayment != null} onClose={() => setSelectedPayment(null)} fullWidth>
        <DialogTitle>Payment received</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography>Dairy name: {selectedPayment?.dairyName}</Typography>
            <Typography>Amount: ₹{selectedPayment?.amount}</Typography>
            <Typography>Paid on: {selectedPayment?.paidOn}</Typography>
            {selectedPayment?.note ? <Typography>Note: {selectedPayment.note}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPayment(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <Card variant="outlined" sx={{ minWidth: 160 }}>
      <CardContent>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="h6">₹{value ?? '0.00'}</Typography>
      </CardContent>
    </Card>
  )
}

function SlipDialog({
  open,
  busy,
  onClose,
  onSave,
}: {
  open: boolean
  busy: boolean
  onClose: () => void
  onSave: (payload: CreateDairySlipPayload) => void
}) {
  const [dairyName, setDairyName] = useState('')
  const [slipDate, setSlipDate] = useState(todayIso())
  const [litres, setLitres] = useState('')
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('')
  const [fatPercent, setFatPercent] = useState('')
  const hint = slipAmount(litres, rate)

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth>
      <DialogTitle>Add slip</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField label="Dairy name" value={dairyName} onChange={(e) => setDairyName(e.target.value)} />
          <TextField label="Slip date" value={slipDate} onChange={(e) => setSlipDate(e.target.value)} />
          <TextField label="Litres" value={litres} onChange={(e) => setLitres(e.target.value)} />
          <TextField label="Rate per litre" value={rate} onChange={(e) => setRate(e.target.value)} />
          <TextField
            label="Amount"
            value={amount}
            placeholder={hint}
            helperText={hint ? `Litres × rate = ${hint}. Leave blank to use that.` : ' '}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TextField label="Fat %" value={fatPercent} onChange={(e) => setFatPercent(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() =>
            onSave({
              dairyName: dairyName.trim(),
              slipDate: slipDate.trim(),
              litres: litres.trim(),
              rate: rate.trim(),
              ...(amount.trim() ? { amount: amount.trim() } : {}),
              ...(fatPercent.trim() ? { fatPercent: fatPercent.trim() } : {}),
            })
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function PaymentDialog({
  open,
  busy,
  onClose,
  onSave,
}: {
  open: boolean
  busy: boolean
  onClose: () => void
  onSave: (payload: CreateDairyPaymentPayload) => void
}) {
  const [dairyName, setDairyName] = useState('')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(todayIso())
  const [note, setNote] = useState('')
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth>
      <DialogTitle>Payment received</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField label="Dairy name" value={dairyName} onChange={(e) => setDairyName(e.target.value)} />
          <TextField label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField label="Paid on" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() =>
            onSave({
              dairyName: dairyName.trim(),
              amount: amount.trim(),
              paidOn: paidOn.trim(),
              ...(note.trim() ? { note: note.trim() } : {}),
            })
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
