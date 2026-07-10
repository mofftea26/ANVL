import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawer } from './Drawer'

const meta: Meta<typeof Drawer> = {
  title: 'Components/Drawer',
  component: Drawer,
  args: {
    open: true,
    onClose: () => {},
    title: 'Your bag',
    children: <p className="text-sm text-[var(--color-text-muted)]">2 items — $96.00</p>,
  },
}
export default meta

type Story = StoryObj<typeof Drawer>

export const Right: Story = {
  args: { placement: 'right' },
}

export const Left: Story = {
  args: { placement: 'left' },
}

export const Bottom: Story = {
  args: { placement: 'bottom' },
}
