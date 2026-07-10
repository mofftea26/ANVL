import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Live' },
}
export default meta

type Story = StoryObj<typeof Badge>

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="live">Live</Badge>
      <Badge tone="scheduled">Scheduled</Badge>
      <Badge tone="archived">Archived</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="accent">Accent</Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm" tone="live">
        Small
      </Badge>
      <Badge size="default" tone="live">
        Default
      </Badge>
      <Badge size="chip" tone="live">
        Chip
      </Badge>
    </div>
  ),
}
