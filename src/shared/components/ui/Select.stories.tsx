import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select, SelectItem } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  args: {
    placeholder: 'Select…',
    'aria-label': 'Size',
  },
  render: (args) => (
    <Select {...args}>
      <SelectItem value="s">Small</SelectItem>
      <SelectItem value="m">Medium</SelectItem>
      <SelectItem value="l">Large</SelectItem>
      <SelectItem value="xl">Extra large</SelectItem>
    </Select>
  ),
}
export default meta

type Story = StoryObj<typeof Select>

export const Comfortable: Story = {
  args: { density: 'comfortable', defaultValue: 'm' },
}

export const Compact: Story = {
  args: { density: 'compact', defaultValue: 'm' },
}

export const Placeholder: Story = {
  args: { density: 'comfortable' },
}

export const Disabled: Story = {
  args: { density: 'comfortable', defaultValue: 'm', disabled: true },
}
