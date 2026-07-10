import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeTintedMediaMark } from './ThemeTintedMediaMark'

const meta: Meta<typeof ThemeTintedMediaMark> = {
  title: 'Components/ThemeTintedMediaMark',
  component: ThemeTintedMediaMark,
  args: {
    src: '/brand/mark.svg',
    width: 96,
    height: 96,
  },
}
export default meta

type Story = StoryObj<typeof ThemeTintedMediaMark>

export const Default: Story = {}

export const Large: Story = {
  args: { width: 160, height: 160 },
}
