import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heart, Menu, Share2 } from '@/shared/icons'
import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Menu', children: <Menu size={18} /> },
}
export default meta

type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: { variant: 'default' },
}

export const Ghost: Story = {
  args: { variant: 'ghost' },
}

export const Overlay: Story = {
  args: {
    variant: 'overlay',
    size: 'sm',
    'aria-label': 'Share',
    children: <Share2 size={17} />,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton size="md" aria-label="Favorite">
        <Heart size={18} />
      </IconButton>
      <IconButton size="sm" aria-label="Favorite">
        <Heart size={16} />
      </IconButton>
    </div>
  ),
}
