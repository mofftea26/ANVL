import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: {
    title: 'Your cart is empty',
    description: 'Add a piece from Drop 01 — The Oath to get started.',
    actionLabel: 'Shop the drop',
    onAction: () => {},
  },
}
export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {}
