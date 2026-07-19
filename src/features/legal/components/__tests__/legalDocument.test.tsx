import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { resolveLegalPage } from '@/features/cms/legal/resolveLegalContent'
import { DEFAULT_LEGAL_CONTENT } from '@/features/cms/legal/legalContent.zod'
import { LegalDocument } from '@/features/legal/components/LegalDocument'

describe('LegalDocument', () => {
  const page = resolveLegalPage(DEFAULT_LEGAL_CONTENT, 'privacy')

  it('renders the resolved title, last-updated stamp, and intro', () => {
    render(<LegalDocument page={page} />)
    expect(screen.getByRole('heading', { level: 1, name: page.title })).toBeInTheDocument()
    expect(screen.getByText(/Last updated/)).toBeInTheDocument()
    expect(screen.getByText(page.intro)).toBeInTheDocument()
  })

  it('renders every section heading and an in-page table of contents', () => {
    render(<LegalDocument page={page} />)
    for (const section of page.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
    }
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(toc).toBeInTheDocument()
  })
})
