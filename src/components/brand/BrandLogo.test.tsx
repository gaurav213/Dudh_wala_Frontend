import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandLogo } from './BrandLogo'
import { appBrand } from '../../branding/appBrand'

describe('BrandLogo', () => {
  it('renders the full logo with Doodh Wala alt text', () => {
    render(<BrandLogo variant="full" />)
    const img = screen.getByRole('img', { name: appBrand.name })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('logo_mark')
  })

  it('renders compact mark for small spaces', () => {
    render(<BrandLogo variant="compact" height={28} />)
    const img = screen.getByRole('img', { name: appBrand.name })
    expect(img.getAttribute('src')).toContain('logo_mark')
  })
})
