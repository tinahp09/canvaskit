import { expect, it } from 'vitest'
import { CanvasKit, EditorSession } from '../src/index.js'
import { serializeScene } from '../src/serialization.js'

it('records a captured current scene as the clean baseline', () => {
  const session = new EditorSession()
  const kit = new CanvasKit()
  session.openDocument({ id: 'brief', title: 'Brief', kit })

  expect(session.markDocumentSaved('brief', serializeScene(kit.getScene()))).toBe(true)
  expect(session.getSnapshot().documents).toEqual([{ id: 'brief', title: 'Brief', isDirty: false }])
})
