import {
  AssignmentIndOutlined,
  HomeOutlined,
  LocationOnOutlined,
  LogoutOutlined,
  Menu as MenuIcon,
  PaymentsOutlined,
  PersonOutlined,
  SettingsOutlined,
  StorefrontOutlined,
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

export function CustomerLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const navItems = useMemo(
    () => [
      { to: '/customer', label: t('navHome'), icon: <HomeOutlined />, end: true },
      { to: '/customer/farms', label: t('navFindFarms'), icon: <StorefrontOutlined /> },
      { to: '/customer/requests', label: t('navInbox'), icon: <AssignmentIndOutlined /> },
      { to: '/customer/billing', label: t('navBilling'), icon: <PaymentsOutlined /> },
      { to: '/customer/addresses', label: t('navAddresses'), icon: <LocationOnOutlined /> },
      { to: '/customer/profile', label: t('navProfile'), icon: <PersonOutlined /> },
      { to: '/customer/settings', label: t('navSettings'), icon: <SettingsOutlined /> },
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
            {t('customer')}
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
            {t('customerShellTitle')}
          </Typography>
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
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
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
