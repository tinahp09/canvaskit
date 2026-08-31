import type { CanvasCommandDefinition, CanvasPlugin } from '@canvaskit/core'

export interface CommandPluginOptions extends CanvasCommandDefinition {}

export function createCommandPlugin(options: CommandPluginOptions): CanvasPlugin {
  return {
    id: `command:${options.id}`,
    install(canvas) { return canvas.registerCommand(options) },
  }
}
