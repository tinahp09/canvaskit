import { expect, it } from 'vitest'
import { addRectangle, CanvasKit, EditorSession, type EditorSessionSnapshot } from '../src/index.js'

function createKit(): CanvasKit {
  return new CanvasKit()
}

function addTestRectangle(kit: CanvasKit, id: string): void {
  const before = kit.getScene()
  kit.execute({
    label: `add ${id}`,
    execute: (scene) => addRectangle(scene, {
      id,
      position: { x: 10, y: 20 },
      size: { width: 30, height: 40 },
      fill: '#5b8def',
    }),
    undo: () => before,
  })
}

it('opens documents in order, activates one, and rejects duplicate document IDs', () => {
  const session = new EditorSession()
  const first = createKit()
  const second = createKit()

  session.openDocument({ id: 'brief', title: 'Creative brief', kit: first })
  session.openDocument({ id: 'poster', title: 'Poster', kit: second })
  expect(session.activateDocument('poster')).toBe(true)

  expect(session.getSnapshot()).toEqual({
    activeDocumentId: 'poster',
    documents: [
      { id: 'brief', title: 'Creative brief', isDirty: false },
      { id: 'poster', title: 'Poster', isDirty: false },
    ],
  })
  expect(() => session.openDocument({ id: 'brief', title: 'Duplicate', kit: createKit() })).toThrow('brief')
})

it('marks a document dirty after a CanvasKit mutation and resets its baseline when saved', () => {
  const session = new EditorSession()
  const kit = createKit()
  session.openDocument({ id: 'brief', title: 'Creative brief', kit })

  addTestRectangle(kit, 'hero')
  expect(session.getSnapshot().documents).toEqual([{ id: 'brief', title: 'Creative brief', isDirty: true }])

  expect(session.saveDocument('brief')).toBe(true)
  expect(session.getSnapshot().documents).toEqual([{ id: 'brief', title: 'Creative brief', isDirty: false }])
})

it('requires confirmation before closing a dirty document and closes it when forced', () => {
  const session = new EditorSession()
  const kit = createKit()
  session.openDocument({ id: 'brief', title: 'Creative brief', kit })
  addTestRectangle(kit, 'hero')

  expect(session.closeDocument('brief')).toEqual({ closed: false, reason: 'requiresConfirmation' })
  expect(session.closeDocument('brief', { force: true })).toEqual({ closed: true })
  expect(session.getSnapshot()).toEqual({ documents: [] })
})

it('detaches its CanvasKit subscription when a document closes', () => {
  const session = new EditorSession()
  const kit = createKit()
  const snapshots: EditorSessionSnapshot[] = []
  session.subscribe((snapshot) => snapshots.push(snapshot))
  session.openDocument({ id: 'brief', title: 'Creative brief', kit })
  session.closeDocument('brief', { force: true })
  const snapshotCountAfterClose = snapshots.length

  addTestRectangle(kit, 'orphaned')

  expect(snapshots).toHaveLength(snapshotCountAfterClose)
})
