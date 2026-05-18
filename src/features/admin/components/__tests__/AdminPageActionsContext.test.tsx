import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useEffect } from 'react'

import {
  AdminPageActionsProvider,
  useAdminPageActions,
  useAdminPageActionsSlot,
} from '@/features/admin/components/AdminPageActionsContext'

function SlotProbe() {
  const slot = useAdminPageActionsSlot()
  return <div data-testid="slot">{slot}</div>
}

function Registrar({ label }: { label: string }) {
  const setActions = useAdminPageActions()
  useEffect(() => {
    setActions(<span>{label}</span>)
    return () => setActions(null)
  }, [label, setActions])
  return null
}

describe('AdminPageActionsProvider', () => {
  it('renders registered actions and clears after registrar unmounts', () => {
    const { rerender } = render(
      <AdminPageActionsProvider>
        <SlotProbe />
        <Registrar label="hello" />
      </AdminPageActionsProvider>,
    )

    expect(screen.getByTestId('slot').textContent).toBe('hello')

    rerender(
      <AdminPageActionsProvider>
        <SlotProbe />
      </AdminPageActionsProvider>,
    )

    expect(screen.getByTestId('slot').textContent).toBe('')
  })
})
