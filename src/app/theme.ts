import { createTheme, type ThemeOptions } from '@mui/material/styles'

/**
 * Doodh Wala admin theme — teal/slate dairy marketplace aesthetic.
 * Intentionally avoids purple-on-white AI defaults.
 *
 * IMPORTANT: `lightTheme` is the existing default look. Do not change these
 * light tokens when adding dark mode — dark is additive only.
 */

const sharedTypography: ThemeOptions['typography'] = {
  fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
  h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
  h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
  h3: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
  h4: { fontWeight: 700, letterSpacing: '-0.02em' },
  h5: { fontWeight: 700, letterSpacing: '-0.01em' },
  h6: { fontWeight: 600 },
  button: { textTransform: 'none', fontWeight: 600 },
}

/** Current production light theme — frozen as the default. */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F766E',
      light: '#14B8A6',
      dark: '#115E59',
      contrastText: '#F8FAFC',
    },
    secondary: {
      main: '#334155',
      light: '#64748B',
      dark: '#1E293B',
      contrastText: '#F8FAFC',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    success: { main: '#059669' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    divider: '#E2E8F0',
  },
  typography: sharedTypography,
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 0% -20%, rgba(20, 184, 166, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(51, 65, 85, 0.08), transparent)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(90deg, #0F172A 0%, #134E4A 100%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            color: '#334155',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
  },
})

/** Additive dark theme — does not alter lightTheme tokens. */
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2DD4BF',
      light: '#5EEAD4',
      dark: '#0F766E',
      contrastText: '#042F2E',
    },
    secondary: {
      main: '#94A3B8',
      light: '#CBD5E1',
      dark: '#64748B',
      contrastText: '#0F172A',
    },
    background: {
      default: '#0B1220',
      paper: '#111827',
    },
    text: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
    },
    success: { main: '#34D399' },
    warning: { main: '#FBBF24' },
    error: { main: '#F87171' },
    divider: '#1F2937',
  },
  typography: sharedTypography,
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 0% -20%, rgba(45, 212, 191, 0.08), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(51, 65, 85, 0.2), transparent)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F172A',
          backgroundImage: 'linear-gradient(90deg, #0F172A 0%, #115E59 100%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #1F2937',
          backgroundColor: '#111827',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            color: '#CBD5E1',
            backgroundColor: '#0F172A',
          },
        },
      },
    },
  },
})

/** @deprecated Prefer lightTheme — kept for any legacy imports. */
export const theme = lightTheme
