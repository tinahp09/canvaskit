import type { Meta, StoryObj } from '@storybook/vue3'
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { defineComponent, h, onBeforeUnmount } from 'vue'
import { CanvasKitCanvas } from './canvas.js'

const meta = {
  title: 'Vue/CanvasKitCanvas',
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

function renderCanvas(args: Record<string, unknown>) {
  return defineComponent({
    setup() {
      const canvas = new CanvasKit({
        scene: addRectangle(createScene(), {
          id: 'welcome',
          position: { x: 180, y: 120 },
          size: { width: 280, height: 110 },
          fill: '#0f766e',
        }),
      })
      onBeforeUnmount(() => canvas.dispose())

      return () => h(CanvasKitCanvas, { canvas, ...args })
    },
  })
}

export const Default: Story = {
  render: (args) => renderCanvas(args),
}

export const CustomAccessibleName: Story = {
  args: { ariaLabel: 'Customer journey editor' },
  render: (args) => renderCanvas(args),
}
