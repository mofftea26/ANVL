import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColorSwatch } from './ColorSwatch'

const meta: Meta<typeof ColorSwatch> = {
  title: 'Components/ColorSwatch',
  component: ColorSwatch,
  args: {
    color: '#0B0B0C',
    label: 'Onyx',
    onClick: () => {},
  },
}
export default meta

type Story = StoryObj<typeof ColorSwatch>

export const Active: Story = {
  args: { active: true },
}

export const Inactive: Story = {
  args: { active: false },
}

export const Unavailable: Story = {
  args: { active: false, unavailable: true, color: '#E7E4DF', label: 'Bone' },
}

export const Row: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <ColorSwatch color="#0B0B0C" label="Onyx" active onClick={() => {}} />
      <ColorSwatch color="#E7E4DF" label="Bone" active={false} onClick={() => {}} />
      <ColorSwatch color="#5B4A36" label="Umber" active={false} unavailable onClick={() => {}} />
    </div>
  ),
}
