import {
  DashboardOutlined,
  LocalShippingOutlined,
  LogoutOutlined,
  Menu as MenuIcon,
  PaymentsOutlined,
  PeopleOutlined,
  PersonOutlined,
  SettingsOutlined,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'
import { BrandLogo } from '../../../components/brand/BrandLogo'
import { appBrand } from '../../../branding/appBrand'
import { useAuth } from '../../../lib/auth/useAuth'
import { confirmLogout } from '../../../lib/auth/confirmLogout'

const DRAWER_WIDTH = 240

export function DeliveryLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const navItems = useMemo(
    () => [
      { to: '/delivery', label: t('navDashboard'), icon: <DashboardOutlined />, end: true },
      { to: '/delivery/today', label: t('navTodaysDeliveries'), icon: <LocalShippingOutlined /> },
      { to: '/delivery/pending-cash', label: t('navPendingCash'), icon: <PaymentsOutlined /> },
      { to: '/delivery/customers', label: t('navCustomers'), icon: <PeopleOutlined /> },
      { to: '/delivery/profile', label: t('navProfile'), icon: <PersonOutlined /> },
      { to: '/delivery/settings', label: t('navSettings'), icon: <SettingsOutlined /> },
    ],
    [t],
  )

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <BrandLogo variant="compact" height={32} />
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
            {appBrand.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('navDeliveryStaff')}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, flex: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
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
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
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
        >
          {t('logOut')}
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile ? (
            <IconButton
              edge="start"
              onClick={() => setOpen(true)}
              sx={{ mr: 1 }}
              aria-label={t('open')}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            {t('deliveryShellTitle')}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer open={open} onClose={() => setOpen(false)}>
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
