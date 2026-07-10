import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Modal } from './Modal'

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  args: {
    open: true,
    onClose: () => {},
    title: 'Delete this act?',
    children: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          This removes the act and its cast. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" density="compact">
            Cancel
          </Button>
          <Button variant="destructive" size="sm" density="compact">
            Delete act
          </Button>
        </div>
      </div>
    ),
  },
}
export default meta

type Story = StoryObj<typeof Modal>

export const Default: Story = {}
