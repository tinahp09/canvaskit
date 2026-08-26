// @vitest-environment jsdom

import { addRectangle, CanvasKit, type CanvasScene } from '@canvaskit/core'
import { act, render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CanvasKitProvider, useCanvasKit, useCanvasScene } from '../src/index.js'

const rectangle = {
  id: 'rectangle',
  position: { x: 10, y: 20 },
  size: { width: 30, height: 40 },
  fill: '#fff',
}

class ObservableCanvasKit extends CanvasKit {
  activeSceneSubscriptions = 0

  override subscribe(listener: (scene: CanvasScene) => void): () => void {
    const unsubscribe = super.subscribe(listener)
    this.activeSceneSubscriptions += 1
    return () => {
      this.activeSceneSubscriptions -= 1
      unsubscribe()
    }
  }
}

function SceneCount() {
  return <output>{useCanvasScene().nodes.length}</output>
}

function CanvasIdentity() {
  return <output>{useCanvasKit() instanceof CanvasKit ? 'available' : 'missing'}</output>
}

it('updates useCanvasScene after a Core mutation and removes its subscription on unmount', () => {
  const kit = new ObservableCanvasKit()
  const view = render(
    <CanvasKitProvider canvas={kit}>
      <SceneCount />
    </CanvasKitProvider>,
  )

  expect(view.getByText('0')).toBeTruthy()
  expect(kit.activeSceneSubscriptions).toBe(1)

  act(() => kit.setScene(addRectangle(kit.getScene(), rectangle)))

  expect(view.getByText('1')).toBeTruthy()
  view.unmount()
  expect(kit.activeSceneSubscriptions).toBe(0)
})

it('returns the provider CanvasKit instance', () => {
  const view = render(
    <CanvasKitProvider canvas={new CanvasKit()}>
      <CanvasIdentity />
    </CanvasKitProvider>,
  )

  expect(view.getByText('available')).toBeTruthy()
})

it('throws a clear error when useCanvasKit is called outside a provider', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  try {
    expect(() => render(<CanvasIdentity />)).toThrow('useCanvasKit must be used within a CanvasKitProvider.')
  } finally {
    consoleError.mockRestore()
  }
})
