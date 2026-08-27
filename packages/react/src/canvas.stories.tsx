import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { CanvasKitCanvas, type CanvasKitCanvasProps } from './canvas.js'

const meta = {
  title: 'React/CanvasKitCanvas',
  component: CanvasKitCanvas,
  args: {
    width: 640,
    height: 360,
    ariaLabel: 'CanvasKit diagram workspace',
  },
  parameters: {
    docs: {
      description: {
        component: 'A labelled, focusable canvas host with pointer and keyboard input bound to its CanvasKit instance.',
      },
    },
  },
} satisfies Meta<typeof CanvasKitCanvas>

export default meta
type Story = StoryObj<typeof meta>

function CanvasHost(args: CanvasKitCanvasProps) {
  const [canvas] = useState(() => new CanvasKit({
    scene: addRectangle(createScene(), {
      id: 'welcome',
      position: { x: 180, y: 120 },
      size: { width: 280, height: 110 },
      fill: '#4f46e5',
    }),
  }))

  useEffect(() => () => canvas.dispose(), [canvas])

  return <CanvasKitCanvas canvas={canvas} {...args} />
}

export const Default: Story = {
  render: (args) => <CanvasHost {...args} />,
}

export const CustomAccessibleName: Story = {
  args: { ariaLabel: 'Customer journey editor' },
  render: (args) => <CanvasHost {...args} />,
}
