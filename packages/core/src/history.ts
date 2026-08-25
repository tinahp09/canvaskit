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
    this.ensureNoActiveTransaction('undo')
    const command = this.undoStack.at(-1)
    if (!command) return scene

    const nextScene = command.undo(scene)
    this.undoStack.pop()
    this.redoStack.push(command)
    return nextScene
  }

  redo(scene: CanvasScene): CanvasScene {
    this.ensureNoActiveTransaction('redo')
    const command = this.redoStack.at(-1)
    if (!command) return scene

    const nextScene = command.execute(scene)
    this.redoStack.pop()
    this.undoStack.push(command)
    return nextScene
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

  clear(): void {
    this.ensureNoActiveTransaction('clear history for')
    this.undoStack.length = 0
    this.redoStack.length = 0
  }

  private ensureNoActiveTransaction(operation: string): void {
    if (this.transaction) throw new Error(`Cannot ${operation} while a history transaction is active.`)
  }
}

function createCompositeCommand(transaction: HistoryTransaction): SceneCommand {
  return {
    label: transaction.label,
    execute: (scene) => transaction.commands.reduce((currentScene, command) => command.execute(currentScene), scene),
    undo: (scene) => transaction.commands.reduceRight((currentScene, command) => command.undo(currentScene), scene),
  }
}
