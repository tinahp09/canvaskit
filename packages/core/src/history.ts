import type { CanvasScene } from './model.js'

export interface SceneCommand {
  label: string
  execute(scene: CanvasScene): CanvasScene
  undo(scene: CanvasScene): CanvasScene
}

interface HistoryTransaction {
  label: string
  commands: SceneCommand[]
}

export class HistoryController {
  private readonly undoStack: SceneCommand[] = []
  private readonly redoStack: SceneCommand[] = []
  private transaction: HistoryTransaction | undefined

  execute(scene: CanvasScene, command: SceneCommand): CanvasScene {
    const nextScene = command.execute(scene)
    this.redoStack.length = 0

    if (this.transaction) {
      this.transaction.commands.push(command)
    } else {
      this.undoStack.push(command)
    }

    return nextScene
  }

  undo(scene: CanvasScene): CanvasScene {
    const command = this.undoStack.pop()
    if (!command) return scene

    this.redoStack.push(command)
    return command.undo(scene)
  }

  redo(scene: CanvasScene): CanvasScene {
    const command = this.redoStack.pop()
    if (!command) return scene

    this.undoStack.push(command)
    return command.execute(scene)
  }

  beginTransaction(label: string): void {
    if (this.transaction) throw new Error('A history transaction is already active.')
    this.transaction = { label, commands: [] }
  }

  commitTransaction(): void {
    const transaction = this.transaction
    if (!transaction) throw new Error('No history transaction is active.')

    this.transaction = undefined
    if (transaction.commands.length === 0) return
    this.undoStack.push(createCompositeCommand(transaction))
  }
}

function createCompositeCommand(transaction: HistoryTransaction): SceneCommand {
  return {
    label: transaction.label,
    execute: (scene) => transaction.commands.reduce((currentScene, command) => command.execute(currentScene), scene),
    undo: (scene) => transaction.commands.reduceRight((currentScene, command) => command.undo(currentScene), scene),
  }
}
