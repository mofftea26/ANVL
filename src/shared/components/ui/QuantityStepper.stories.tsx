import type { Meta, StoryObj } from '@storybook/react-vite'
import { QuantityStepper } from './QuantityStepper'

const meta: Meta<typeof QuantityStepper> = {
  title: 'Components/QuantityStepper',
  component: QuantityStepper,
  args: { onChange: () => {} },
}
export default meta

type Story = StoryObj<typeof QuantityStepper>

export const Default: Story = {
  args: { value: 1 },
}

export const MultipleUnits: Story = {
  args: { value: 3 },
}
