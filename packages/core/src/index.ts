export const PACKAGE_NAME = '@canvaskit/core'

export type { CanvasScene, CreateRectangleInput, RectangleNode } from './model.js'
export { addRectangle, createScene } from './scene.js'
export { loadScene, serializeScene, UnsupportedSceneVersionError } from './serialization.js'
export { ViewportController } from './viewport.js'
export { CanvasKit } from './canvas-kit.js'
export type { CanvasKitOptions, CanvasPointerEvent, CanvasPointerEventType } from './canvas-kit.js'
export { attachPointerInput } from './pointer-input.js'
