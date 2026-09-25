import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { appBrand } from './branding/appBrand'
import './index.css'

// Bundled favicon — public/*.png was falling through to SPA HTML on Vite.
const icon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
if (icon) icon.href = appBrand.favicon
const apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']")
if (apple) apple.href = appBrand.logoCompact

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
