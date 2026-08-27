import { useEffect, useMemo, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CanvasKit, addRectangle, createScene } from '@canvaskit/core'
import { createGridPlugin, createKeyboardPlugin, createMinimapPlugin, createSnapPlugin } from '@canvaskit/plugins'

const meta = {
  title: 'Plugins/Official plugins',
  parameters: {
    docs: {
      description: {
        component: 'Reference states for the official grid, snap, keyboard, and minimap plugins.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OfficialPlugins() {
  const keyboardTarget = useRef<HTMLDivElement>(null)
  const [summary, setSummary] = useState('No scene installed')
  const grid = useMemo(() => createGridPlugin({ size: 24, style: 'dots', color: '#94a3b8' }), [])
  const snap = useMemo(() => createSnapPlugin({ gridSize: 24 }), [])

  useEffect(() => {
    const canvas = new CanvasKit({
      scene: addRectangle(createScene(), {
        id: 'card',
        position: { x: 40, y: 40 },
        size: { width: 180, height: 96 },
        fill: '#4f46e5',
      }),
    })
    const minimap = createMinimapPlugin()
    const keyboard = createKeyboardPlugin(keyboardTarget.current!)
    canvas.use(grid)
    canvas.use(snap)
    canvas.use(minimap)
    canvas.use(keyboard)
    setSummary(`${minimap.summary?.nodeCount ?? 0} node, ${minimap.summary?.edgeCount ?? 0} edges`)

    return () => canvas.dispose()
  }, [grid, snap])

  return (
    <section ref={keyboardTarget} tabIndex={0} aria-label="Official plugin preview" style={{ display: 'grid', gap: 12, minWidth: 360 }}>
      <h2 style={{ margin: 0 }}>Official plugins</h2>
      <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
        <div><dt>Grid</dt><dd>{grid.config.style} every {grid.config.size}px</dd></div>
        <div><dt>Snap</dt><dd>Snaps points to {snap.config.gridSize}px increments</dd></div>
        <div><dt>Keyboard</dt><dd>Focus here, then use Control/Command+A to select all.</dd></div>
        <div><dt>Minimap</dt><dd aria-live="polite">{summary}</dd></div>
      </dl>
    </section>
  )
}

export const Reference: Story = {
  render: () => <OfficialPlugins />,
}
