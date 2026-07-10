import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
}
export default meta

type Story = StoryObj<typeof Checkbox>

export const Bare: Story = {
  args: { 'aria-label': 'Select item', defaultChecked: true },
}

export const LabeledRow: Story = {
  args: {
    label: 'Published',
    description: 'Only published chapters are visible on the storefront.',
  },
}

export const Checked: Story = {
  args: {
    label: 'Show the shop hero',
    description: 'The cinematic intro band. Off = a compact heading only.',
    defaultChecked: true,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Legacy option',
    description: 'No longer configurable.',
    disabled: true,
  },
}
