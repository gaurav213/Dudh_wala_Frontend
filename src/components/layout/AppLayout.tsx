import {
  AccountBalanceWalletOutlined,
  AssessmentOutlined,
  DashboardOutlined,
  LocalShippingOutlined,
  LogoutOutlined,
  Menu as MenuIcon,
  PaymentsOutlined,
  PeopleOutlined,
  ReceiptLongOutlined,
  SettingsOutlined,
  StorefrontOutlined,
  HistoryOutlined,
} from '@mui/icons-material'
import {
  AppBar,
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
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/useAuth'

const DRAWER_WIDTH = 260

const navItems = [
  { to: '/', label: 'Dashboard', icon: <DashboardOutlined />, roles: ['ADMIN'] },
  { to: '/suppliers', label: 'Suppliers', icon: <StorefrontOutlined />, roles: ['ADMIN'] },
  { to: '/customers', label: 'Customers', icon: <PeopleOutlined />, roles: ['ADMIN'] },
  { to: '/deliveries', label: 'Deliveries', icon: <LocalShippingOutlined />, roles: ['ADMIN'] },
  { to: '/billing', label: 'Billing', icon: <ReceiptLongOutlined />, roles: ['ADMIN'] },
  { to: '/payments', label: 'Payments', icon: <PaymentsOutlined />, roles: ['ADMIN'] },
  { to: '/reports/outstanding', label: 'Outstanding', icon: <AssessmentOutlined />, roles: ['ADMIN'] },
  { to: '/audit', label: 'Audit', icon: <HistoryOutlined />, roles: ['ADMIN'] },
  { to: '/settings', label: 'Settings', icon: <SettingsOutlined />, roles: ['ADMIN'] },
] as const

export function AppLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role as 'ADMIN'))

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <AccountBalanceWalletOutlined color="primary" />
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
            Doodh Khata
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin console
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
            end={item.to === '/'}
            onClick={() => isMobile && setOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                bgcolor: 'rgba(15, 118, 110, 0.1)',
                color: 'primary.dark',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {user?.fullName}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          {user?.email}
        </Typography>
        <Button
          startIcon={<LogoutOutlined />}
          onClick={() => void logout()}
          size="small"
          sx={{ mt: 1.5 }}
          fullWidth
          variant="outlined"
          color="secondary"
        >
          Sign out
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
            <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Milk ledger administration
          </Typography>
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
