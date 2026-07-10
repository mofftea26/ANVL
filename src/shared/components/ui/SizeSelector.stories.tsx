import type { Meta, StoryObj } from '@storybook/react-vite'
import { SizeSelector } from './SizeSelector'

const meta: Meta<typeof SizeSelector> = {
  title: 'Components/SizeSelector',
  component: SizeSelector,
  args: {
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    onChange: () => {},
  },
}
export default meta

type Story = StoryObj<typeof SizeSelector>

export const Default: Story = {
  args: { value: 'M' },
}

export const WithDisabledSizes: Story = {
  args: { value: 'L', disabledSizes: new Set(['S', 'XXL']) },
}
