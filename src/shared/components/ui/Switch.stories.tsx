import type { Meta, StoryObj } from '@storybook/react-vite'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  args: {
    label: 'Order updates',
    description: 'Email me when my order ships.',
    onChange: () => {},
  },
}
export default meta

type Story = StoryObj<typeof Switch>

export const On: Story = {
  args: { checked: true },
}

export const Off: Story = {
  args: { checked: false },
}
