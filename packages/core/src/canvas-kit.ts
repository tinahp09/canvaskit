import { screenToWorld, type Point, type Rect } from '@canvaskit/geometry'
import type { CanvasLayer, CanvasScene } from './model.js'
import { createScene } from './scene.js'
import { loadScene, serializeScene } from './serialization.js'
import { ViewportController } from './viewport.js'
import { SelectionController } from './selection.js'
import type { SelectionMode } from './selection.js'
import { nodesInRect, type MarqueeMode } from './interaction.js'
import { HistoryController, type SceneCommand } from './history.js'
import { cloneClipboard, copySelection, pasteSelection, removeSelection, type SceneClipboard } from './clipboard.js'
import type { EditorCommand } from './editor-command.js'
import type { CanvasPlugin } from './plugin.js'
import { EdgeRegistry, NodeRegistry } from './registry.js'
import { SceneSubscription, type SceneListener } from './scene-subscription.js'
import { TransformController, type AlignmentAxis, type DistributionAxis, type TransformConstraints, type TransformHandle } from './transform.js'
import { addLayer, groupNodes, isNodeInteractive, moveNodesToLayer, reorderLayer as reorderLayers, reorderNodeInLayer, setLayerLocked, setLayerVisibility, ungroupNodes } from './document.js'

export type CanvasPointerEventType = 'pointerdown' | 'pointermove' | 'pointerup'

export interface CanvasPointerModifiers {
  shiftKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}

export interface CanvasPointerEvent {
  type: CanvasPointerEventType
  screen: Point
  world: Point
  modifiers?: CanvasPointerModifiers
  button?: number
  buttons?: number
}

export interface MarqueeSelectionOptions {
  mode?: MarqueeMode
  selection?: SelectionMode
}

export interface CanvasKitOptions {
  scene?: CanvasScene
}

export class CanvasKit {
  private scene: CanvasScene
  private readonly listeners = new Set<(event: CanvasPointerEvent) => void>()
  private readonly sceneSubscription = new SceneSubscription()
  private readonly history = new HistoryController()
  private clipboard: SceneClipboard = { nodes: [], edges: [], groups: [] }
  private readonly pluginIds = new Set<string>()
  private readonly pluginCleanups: Array<() => void> = []
  viewport: ViewportController
  readonly selection: SelectionController
  readonly transform = new TransformController()
  readonly nodes = new NodeRegistry()
  readonly edges = new EdgeRegistry()

  constructor(options: CanvasKitOptions = {}) {
    this.scene = options.scene ?? createScene()
    this.viewport = this.createViewport(this.scene)
    this.selection = new SelectionController(
      () => this.getScene(),
      () => this.notifyScene(),
      (id) => this.isNodeInteractive(id),
    )
  }

  getScene(): CanvasScene {
    return { ...this.scene, viewport: this.viewport.getTransform() }
  }

  isNodeInteractive(id: string): boolean {
    return isNodeInteractive(this.getScene(), id)
  }

  setScene(scene: CanvasScene): void {
    this.clearHistory()
    this.applyScene(scene)
    this.notifyScene()
  }

  private createViewport(scene: CanvasScene): ViewportController {
    return new ViewportController(scene.viewport, () => {
      this.history.clearRedo()
      this.notifyScene()
    })
  }

  private applyScene(scene: CanvasScene): void {
    this.scene = scene
    this.viewport = this.createViewport(scene)
    this.selection.retainExisting()
  }

  execute(command: SceneCommand): CanvasScene {
    this.applyScene(this.history.execute(this.getScene(), command))
    this.notifyScene()
    return this.getScene()
  }

  undo(): CanvasScene {
    this.applyScene(this.history.undo(this.getScene()))
    this.notifyScene()
    return this.getScene()
  }

  redo(): CanvasScene {
    this.applyScene(this.history.redo(this.getScene()))
    this.notifyScene()
    return this.getScene()
  }

  clearHistory(): void {
    this.history.clear()
  }

  beginTransaction(label: string): void {
    this.history.beginTransaction(label)
  }

  commitTransaction(): void {
    this.history.commitTransaction()
  }

  copy(): SceneClipboard {
    this.clipboard = copySelection(this.getScene(), this.selection.get())
    return cloneClipboard(this.clipboard)
  }

  cut(): SceneClipboard {
    const ids = this.selection.get()
    if (ids.length === 0) return cloneClipboard(this.clipboard)

    const before = this.getScene()
    this.clipboard = copySelection(before, ids)
    const after = removeSelection(before, [...ids])
    this.execute({
      label: 'cut selection',
      execute: () => after,
      undo: () => before,
    })
    this.selection.clear()
    return cloneClipboard(this.clipboard)
  }

  paste(offset: Point = { x: 20, y: 20 }): string[] {
    const before = this.getScene()
    const result = pasteSelection(before, this.clipboard, offset)
    if (result.ids.length === 0) return []

    this.execute({
      label: 'paste selection',
      execute: () => result.scene,
      undo: () => before,
    })
    this.selection.clear()
    this.selection.selectMultiple(result.ids)
    return result.ids
  }

  duplicate(): string[] {
    this.copy()
    return this.paste({ x: 20, y: 20 })
  }

  resizeSelection(handle: TransformHandle, point: Point, constraints?: TransformConstraints): boolean {
    const before = this.getScene()
    const after = this.transform.resize(before, this.selection.get(), handle, point, constraints)
    return this.executeTransform('resize selection', before, after)
  }

  alignSelection(axis: AlignmentAxis): boolean {
    const ids = this.selection.get()
    if (ids.length < 2) return false
    const before = this.getScene()
    return this.executeTransform('align selection', before, this.transform.align(before, ids, axis))
  }

  distributeSelection(axis: DistributionAxis): boolean {
    const ids = this.selection.get()
    if (ids.length < 2) return false
    const before = this.getScene()
    return this.executeTransform('distribute selection', before, this.transform.distribute(before, ids, axis))
  }

  createLayer(layer: CanvasLayer): boolean {
    return this.executeDocument('create layer', (scene) => addLayer(scene, layer))
  }

  moveSelectionToLayer(layerId: string): boolean {
    const ids = this.selection.get()
    if (ids.length === 0) return false
    return this.executeDocument('move selection to layer', (scene) => moveNodesToLayer(scene, ids, layerId))
  }

  setLayerVisible(layerId: string, visible: boolean): boolean {
    return this.setLayerVisibility(layerId, visible)
  }

  setLayerVisibility(layerId: string, visible: boolean): boolean {
    return this.executeDocument('set layer visibility', (scene) => setLayerVisibility(scene, layerId, visible))
  }

  setLayerLocked(layerId: string, locked: boolean): boolean {
    return this.executeDocument('set layer locked', (scene) => setLayerLocked(scene, layerId, locked))
  }

  reorderSelection(targetIndex: number): boolean {
    const ids = this.selection.get()
    if (ids.length === 0) return false
    const before = this.getScene()
    const selectedNodes = before.nodes.filter((node) => ids.includes(node.id))
    const layerId = selectedNodes[0]?.layerId
    if (!layerId || selectedNodes.some((node) => node.layerId !== layerId)) return false
    const selectedIds = new Set(selectedNodes.map((node) => node.id))
    const remainingIds = before.nodes.filter((node) => node.layerId === layerId && !selectedIds.has(node.id)).map((node) => node.id)
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex > remainingIds.length) {
      throw new RangeError('Target index is out of bounds.')
    }
    const orderedIds = [
      ...remainingIds.slice(0, targetIndex),
      ...selectedNodes.map((node) => node.id),
      ...remainingIds.slice(targetIndex),
    ]
    return this.executeDocument('reorder selection', (scene) => orderedIds.reduce(
      (current, nodeId, index) => reorderNodeInLayer(current, nodeId, index),
      scene,
    ))
  }

  reorderLayer(layerId: string, targetIndex: number): boolean {
    return this.executeDocument('reorder layer', (scene) => reorderLayers(scene, layerId, targetIndex))
  }

  groupSelection(): boolean {
    const nodeIds = this.selection.get()
    if (nodeIds.length === 0) return false
    const before = this.getScene()
    const groupId = this.nextGroupId(before)
    const after = groupNodes(before, { id: groupId, nodeIds })
    this.execute({ label: 'group selection', execute: () => after, undo: () => before })
    return true
  }

  ungroupSelection(): boolean {
    const selected = new Set(this.selection.get())
    if (selected.size === 0) return false
    const before = this.getScene()
    const groups = before.groups.filter((group) => group.nodeIds.some((id) => selected.has(id)))
    if (groups.length === 0) return false
    const after = groups.reduce((scene, group) => ungroupNodes(scene, group.id), before)
    this.execute({ label: 'ungroup selection', execute: () => after, undo: () => before })
    return true
  }

  selectInRect(rect: Rect, options: MarqueeSelectionOptions = {}): string[] {
    const ids = nodesInRect(this.getScene(), rect, options.mode ?? 'contain')
    switch (options.selection ?? 'replace') {
      case 'replace': this.selection.set(ids); break
      case 'add': this.selection.add(ids); break
      case 'remove': this.selection.remove(ids); break
      case 'toggle': this.selection.toggle(ids); break
    }
    return ids
  }

  executeCommand(command: EditorCommand): boolean {
    switch (command) {
      case 'select-all':
        this.selection.selectAll()
        return true
      case 'clear-selection':
        this.selection.clear()
        return true
      case 'delete-selection':
        this.deleteSelection()
        return true
      case 'group-selection': return this.groupSelection()
      case 'ungroup-selection': return this.ungroupSelection()
      case 'copy':
        if (this.selection.get().length === 0) return false
        this.copy()
        return true
      case 'cut':
        if (this.selection.get().length === 0) return false
        this.cut()
        return true
      case 'paste':
        return this.paste().length > 0
      case 'duplicate':
        if (this.selection.get().length === 0) return false
        return this.duplicate().length > 0
      case 'align-left': return this.alignSelection('left')
      case 'align-center': return this.alignSelection('center')
      case 'align-right': return this.alignSelection('right')
      case 'align-top': return this.alignSelection('top')
      case 'align-middle': return this.alignSelection('middle')
      case 'align-bottom': return this.alignSelection('bottom')
      case 'distribute-horizontal': return this.distributeSelection('horizontal')
      case 'distribute-vertical': return this.distributeSelection('vertical')
    }
  }

  use(plugin: CanvasPlugin): void {
    if (this.pluginIds.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already installed.`)
    }
    this.pluginIds.add(plugin.id)
    try {
      const cleanup = plugin.install(this)
      if (cleanup) this.pluginCleanups.push(cleanup)
    } catch (error) {
      this.pluginIds.delete(plugin.id)
      throw error
    }
  }

  dispose(): void {
    while (this.pluginCleanups.length > 0) {
      this.pluginCleanups.pop()?.()
    }
  }

  toJSON(): string { return serializeScene(this.getScene()) }

  load(json: string): void { this.setScene(loadScene(json)) }

  deleteSelection(): void {
    const ids = new Set(this.selection.get())
    if (ids.size === 0) return
    const before = this.getScene()
    const after = removeSelection(before, [...ids])
    this.execute({ label: 'delete selection', execute: () => after, undo: () => before })
    this.selection.clear()
  }

  onPointer(listener: (event: CanvasPointerEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribe(listener: SceneListener): () => void {
    return this.sceneSubscription.subscribe(listener)
  }

  private notifyScene(): void {
    this.sceneSubscription.notify(this.getScene())
  }

  private executeTransform(label: string, before: CanvasScene, after: CanvasScene): boolean {
    if (JSON.stringify(before) === JSON.stringify(after)) return false
    this.execute({ label, execute: () => after, undo: () => before })
    return true
  }

  private executeDocument(label: string, operation: (scene: CanvasScene) => CanvasScene): boolean {
    const before = this.getScene()
    const after = operation(before)
    if (JSON.stringify(before) === JSON.stringify(after)) return false
    this.execute({ label, execute: () => after, undo: () => before })
    return true
  }

  private nextGroupId(scene: CanvasScene): string {
    const ids = new Set(scene.groups.map((group) => group.id))
    let number = 1
    while (ids.has(`group-${number}`)) number += 1
    return `group-${number}`
  }

  createPointerEvent(screen: Point, type: CanvasPointerEventType, modifiers?: CanvasPointerModifiers, button?: number, buttons?: number): CanvasPointerEvent {
    const event: CanvasPointerEvent = {
      type,
      screen,
      world: screenToWorld(screen, this.viewport.getTransform()),
      ...(modifiers ? { modifiers } : {}),
      ...(button === undefined ? {} : { button }),
      ...(buttons === undefined ? {} : { buttons }),
    }
    this.listeners.forEach((listener) => listener(event))
    return event
  }
}
