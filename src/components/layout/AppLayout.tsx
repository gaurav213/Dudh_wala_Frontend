import {
  AssessmentOutlined,
  AssignmentIndOutlined,
  BadgeOutlined,
  DashboardOutlined,
  FactCheckOutlined,
  GroupsOutlined,
  HistoryOutlined,
  LocalShippingOutlined,
  LocationOnOutlined,
  LogoutOutlined,
  MailOutlined,
  Menu as MenuIcon,
  OpacityOutlined,
  PaymentsOutlined,
  PeopleOutlined,
  ReceiptLongOutlined,
  SettingsOutlined,
  StorefrontOutlined,
  SubscriptionsOutlined,
} from '@mui/icons-material'
import {
  AppBar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../brand/BrandLogo'
import { appBrand } from '../../branding/appBrand'
import { farmApi } from '../../features/farm/api/farmApi'
import { notificationsApi } from '../../features/notifications/api/notificationsApi'
import { useAuth } from '../../lib/auth/useAuth'
import { confirmLogout } from '../../lib/auth/confirmLogout'

const DRAWER_WIDTH = 280

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: number
}

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const dashboardQuery = useQuery({
    queryKey: ['farm', 'dashboard'],
    queryFn: () => farmApi.myDashboard(),
    enabled: user?.role === 'FARM_OWNER',
    refetchInterval: 30_000,
  })
  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.unreadCount()).count,
    enabled: Boolean(user),
    refetchInterval: 20_000,
  })

  const pendingRequests = dashboardQuery.data?.counts.pendingServiceRequests ?? 0
  const unread = unreadQuery.data ?? 0
  const bellCount = Math.max(unread, pendingRequests)

  const filtered = useMemo<NavItem[]>(() => {
    if (user?.role === 'FARM_OWNER') {
      return [
        { to: '/farm/today', label: t('navTodaysDeliveries'), icon: <LocalShippingOutlined /> },
        { to: '/farm', label: t('navDashboard'), icon: <DashboardOutlined />, end: true },
        { to: '/farm/profile', label: t('navFarmProfile'), icon: <BadgeOutlined /> },
        { to: '/farm/service-areas', label: t('navServiceAreas'), icon: <LocationOnOutlined /> },
        { to: '/farm/products', label: t('navProducts'), icon: <OpacityOutlined /> },
        {
          to: '/farm/requests',
          label: t('navRequests'),
          icon: <AssignmentIndOutlined />,
          badge: pendingRequests,
        },
        { to: '/farm/invitations', label: t('navInvitations'), icon: <MailOutlined /> },
        { to: '/farm/customers', label: t('navConnectedCustomers'), icon: <GroupsOutlined /> },
        // TEMP: delivery-staff disabled — restore next update
        // { to: '/farm/staff', label: t('navStaff'), icon: <PeopleOutlined /> },
        { to: '/customers', label: t('navSubscriptions'), icon: <SubscriptionsOutlined /> },
        { to: '/deliveries', label: t('navDeliveryReport'), icon: <FactCheckOutlined /> },
        { to: '/billing', label: t('navBills'), icon: <ReceiptLongOutlined /> },
        { to: '/payments', label: t('navPayments'), icon: <PaymentsOutlined /> },
        { to: '/reports/outstanding', label: t('navReports'), icon: <AssessmentOutlined /> },
        { to: '/settings', label: t('navSettings'), icon: <SettingsOutlined /> },
      ]
    }
    return [
      { to: '/', label: t('navDashboard'), icon: <DashboardOutlined />, end: true },
      { to: '/admin/farms', label: t('navFarmApprovals'), icon: <FactCheckOutlined /> },
      { to: '/suppliers', label: t('navLegacySuppliers'), icon: <StorefrontOutlined /> },
      { to: '/customers', label: t('navCustomers'), icon: <PeopleOutlined /> },
      { to: '/deliveries', label: t('navTodaysDeliveries'), icon: <LocalShippingOutlined /> },
      { to: '/billing', label: t('navBilling'), icon: <ReceiptLongOutlined /> },
      { to: '/payments', label: t('navPayments'), icon: <PaymentsOutlined /> },
      { to: '/reports/outstanding', label: t('navOutstanding'), icon: <AssessmentOutlined /> },
      { to: '/audit', label: t('navAudit'), icon: <HistoryOutlined /> },
      { to: '/settings', label: t('navSettings'), icon: <SettingsOutlined /> },
    ]
  }, [t, user?.role, pendingRequests])

  const consoleLabel = user?.role === 'FARM_OWNER' ? t('farmConsole') : t('platformConsole')

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <BrandLogo variant="compact" height={32} />
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
            {appBrand.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {consoleLabel}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, flex: 1 }}>
        {filtered.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end ?? item.to === '/'}
            onClick={() => isMobile && setOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.badge && item.badge > 0 ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                item.badge && item.badge > 0
                  ? `${item.label} (${item.badge})`
                  : item.label
              }
            />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          {user?.mobileNumber}
        </Typography>
        <Button
          startIcon={<LogoutOutlined />}
          onClick={() => {
            if (confirmLogout(t('logOutConfirmMessage'))) void logout()
          }}
          size="small"
          sx={{ mt: 1.5 }}
          fullWidth
          variant="outlined"
          color="secondary"
        >
          {t('signOut')}
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setOpen(true)}
              aria-label={t('open')}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {t('appTitle')}
          </Typography>
          {bellCount > 0 ? (
            <Badge badgeContent={bellCount} color="error" sx={{ mr: 2 }}>
              <Typography variant="body2">{t('notifications')}</Typography>
            </Badge>
          ) : null}
          <Button color="inherit" onClick={() => navigate('/settings')} size="small">
            {user?.role}
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}>
            <Box sx={{ width: DRAWER_WIDTH }}>{drawer}</Box>
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
