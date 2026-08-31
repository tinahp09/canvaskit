import { screenToWorld, type Point, type Rect } from '@canvaskit/geometry'
import type { CanvasGuide, CanvasLayer, CanvasScene, CreateConnectorInput } from './model.js'
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
import { ConnectorController } from './connector.js'
import { LayoutController, type AutoLayoutOptions, type SnapOptions, type SnapResult } from './layout.js'
import { ContentController, type CreateImageInput } from './content.js'

export type CanvasPointerEventType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel'

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
  private selectedConnectorId: string | undefined
  private activeLayoutGuides: CanvasGuide[] = []
  private readonly pluginIds = new Set<string>()
  private readonly pluginCleanups: Array<() => void> = []
  viewport: ViewportController
  readonly selection: SelectionController
  readonly transform = new TransformController()
  readonly nodes = new NodeRegistry()
  readonly edges = new EdgeRegistry()
  readonly layout = new LayoutController()
  readonly content = new ContentController()

  constructor(options: CanvasKitOptions = {}) {
    this.scene = options.scene ?? createScene()
    this.viewport = this.createViewport(this.scene)
    this.selection = new SelectionController(
      () => this.getScene(),
      () => {
        this.selectedConnectorId = undefined
        this.activeLayoutGuides = []
        this.notifyScene()
      },
      (id) => this.isNodeInteractive(id),
    )
  }

  getScene(): CanvasScene {
    return { ...this.scene, viewport: this.viewport.getTransform() }
  }

  isNodeInteractive(id: string): boolean {
    return isNodeInteractive(this.getScene(), id)
  }

  /** Creates a connector when both validated endpoint nodes are interactive. */
  createConnector(input: CreateConnectorInput): boolean {
    const before = this.getScene()
    const after = new ConnectorController().create(before, input)
    const connector = after.connectors.at(-1)!
    if (!this.isConnectorInteractive(connector, before)) return false
    return this.executeSceneChange('create connector', before, after)
  }

  /** Replaces one connector endpoint when the resulting connector remains interactive. */
  reconnectConnector(id: string, endpoint: 'source' | 'target', nodeId: string, portId: string): boolean {
    if (endpoint !== 'source' && endpoint !== 'target') throw new Error(`Unknown connector endpoint: "${endpoint}".`)
    const before = this.getScene()
    const after = new ConnectorController().reconnect(before, id, {
      [endpoint]: { nodeId, portId },
    })
    const connector = after.connectors.find((candidate) => candidate.id === id)!
    if (!this.isConnectorInteractive(connector, before)) return false
    return this.executeSceneChange('reconnect connector', before, after)
  }

  /** Removes an existing connector as one undoable scene mutation. */
  removeConnector(id: string): boolean {
    const before = this.getScene()
    const after = new ConnectorController().remove(before, id)
    const changed = this.executeSceneChange('remove connector', before, after)
    if (changed && this.selectedConnectorId === id) this.selectedConnectorId = undefined
    return changed
  }

  /** Selects an interactive connector for selection-aware commands. */
  selectConnector(id: string): boolean {
    const connector = this.getScene().connectors.find((candidate) => candidate.id === id)
    if (!connector) throw new Error(`Unknown connector id: "${id}".`)
    if (!this.isConnectorInteractive(connector)) return false
    if (this.selectedConnectorId === id && this.selection.get().length === 0) return false
    this.selection.clear()
    this.selectedConnectorId = id
    this.notifyScene()
    return true
  }

  getSelectedConnector(): string | undefined {
    const connector = this.selectedConnectorId === undefined
      ? undefined
      : this.getScene().connectors.find((candidate) => candidate.id === this.selectedConnectorId)
    return connector && this.isConnectorInteractive(connector) ? connector.id : undefined
  }

  /** Clears either node or connector selection, returning whether state changed. */
  clearSelection(): boolean {
    const hasNodeSelection = this.selection.get().length > 0
    const hasConnectorSelection = this.selectedConnectorId !== undefined
    if (!hasNodeSelection && !hasConnectorSelection) return false
    this.selectedConnectorId = undefined
    this.activeLayoutGuides = []
    if (hasNodeSelection) this.selection.clear()
    else this.notifyScene()
    return true
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
    this.activeLayoutGuides = []
    if (this.getSelectedConnector() === undefined) this.selectedConnectorId = undefined
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

  createGuide(guide: CanvasGuide): boolean {
    return this.executeDocument('create guide', (scene) => this.layout.createGuide(scene, guide))
  }

  addAsset(asset: import('./model.js').CanvasAsset): boolean { return this.executeDocument('add asset', (scene) => this.content.addAsset(scene, asset)) }
  removeAsset(id: string): boolean { return this.executeDocument('remove asset', (scene) => this.content.removeAsset(scene, id)) }
  addImage(input: CreateImageInput): boolean { return this.executeDocument('add image', (scene) => this.content.addImage(scene, input)) }
  updateImage(id: string, patch: Partial<Pick<CreateImageInput, 'fit' | 'crop'>>): boolean { return this.executeDocument('update image', (scene) => this.content.updateImage(scene, id, patch)) }

  moveGuide(id: string, position: number): boolean {
    return this.executeDocument('move guide', (scene) => this.layout.moveGuide(scene, id, position))
  }

  removeGuide(id: string): boolean {
    return this.executeDocument('remove guide', (scene) => this.layout.removeGuide(scene, id))
  }

  layoutSelection(options: AutoLayoutOptions): boolean {
    const ids = this.selection.get()
    if (ids.length === 0) return false
    const before = this.getScene()
    return this.executeSceneChange('layout selection', before, this.layout.autoLayout(before, ids, options))
  }

  snapSelection(proposedDelta: Point, options?: SnapOptions): SnapResult {
    const result = this.layout.snapTranslation(this.getScene(), this.selection.get(), proposedDelta, options)
    this.activeLayoutGuides = [...result.activeGuides]
    this.notifyScene()
    return result
  }

  getActiveLayoutGuides(): readonly CanvasGuide[] {
    return this.activeLayoutGuides
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
        return this.clearSelection()
      case 'delete-selection':
        return this.deleteSelection()
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

  deleteSelection(): boolean {
    const ids = new Set(this.selection.get())
    if (ids.size === 0) {
      const connectorId = this.getSelectedConnector()
      return connectorId === undefined ? false : this.removeConnector(connectorId)
    }
    const before = this.getScene()
    const after = removeSelection(before, [...ids])
    this.execute({ label: 'delete selection', execute: () => after, undo: () => before })
    this.selection.clear()
    return true
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
    return this.executeSceneChange(label, before, after)
  }

  private executeSceneChange(label: string, before: CanvasScene, after: CanvasScene): boolean {
    if (JSON.stringify(before) === JSON.stringify(after)) return false
    this.execute({ label, execute: () => after, undo: () => before })
    return true
  }

  private isConnectorInteractive(connector: { sourceNodeId: string; targetNodeId: string }, scene = this.getScene()): boolean {
    return isNodeInteractive(scene, connector.sourceNodeId) && isNodeInteractive(scene, connector.targetNodeId)
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
