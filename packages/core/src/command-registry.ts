export interface CommandContext {
  readonly activeDocumentId?: string
}

export interface EditorCommandDefinition {
  readonly id: string
  readonly title: string
  readonly shortcut?: string
  readonly isEnabled?: (context: CommandContext) => boolean
  readonly execute: (context: CommandContext) => void
}

export type CommandResult =
  | { readonly executed: true }
  | { readonly executed: false; readonly reason: 'missing' | 'disabled' }

export interface CommandSnapshot {
  readonly id: string
  readonly title: string
  readonly shortcut?: string
  readonly enabled: boolean
}

const modifierOrder = ['Mod', 'Ctrl', 'Alt', 'Shift']

/** Converts equivalent host shortcut strings to a stable, platform-neutral form. */
export function normalizeShortcut(shortcut: string): string {
  const parts = shortcut
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(normalizeShortcutPart)

  const modifiers = modifierOrder.filter((modifier) => parts.includes(modifier))
  const keys = parts.filter((part) => !modifierOrder.includes(part)).sort()
  return [...modifiers, ...keys].join('+')
}

function normalizeShortcutPart(part: string): string {
  const lower = part.toLowerCase()
  if (lower === 'mod' || lower === 'meta' || lower === 'cmd' || lower === 'command') return 'Mod'
  if (lower === 'ctrl' || lower === 'control') return 'Ctrl'
  if (lower === 'alt' || lower === 'option') return 'Alt'
  if (lower === 'shift') return 'Shift'
  return part.length === 1 ? part.toUpperCase() : part
}

export class CommandRegistry {
  private readonly commands = new Map<string, EditorCommandDefinition>()

  register(definition: EditorCommandDefinition): void {
    if (this.commands.has(definition.id)) {
      throw new Error(`A command with ID \"${definition.id}\" is already registered.`)
    }
    this.commands.set(definition.id, Object.freeze({
      ...definition,
      ...(definition.shortcut ? { shortcut: normalizeShortcut(definition.shortcut) } : {}),
    }))
  }

  unregister(id: string): boolean {
    return this.commands.delete(id)
  }

  getSnapshot(context: CommandContext = {}): readonly CommandSnapshot[] {
    return Object.freeze([...this.commands.values()]
      .map((command) => Object.freeze({
        id: command.id,
        title: command.title,
        ...(command.shortcut ? { shortcut: command.shortcut } : {}),
        enabled: command.isEnabled?.(context) ?? true,
      }))
      .sort((left, right) => left.title.localeCompare(right.title)))
  }

  findByShortcut(shortcut: string): EditorCommandDefinition | undefined {
    const normalized = normalizeShortcut(shortcut)
    return [...this.commands.values()].find((command) => command.shortcut === normalized)
  }

  execute(id: string, context: CommandContext = {}): CommandResult {
    const command = this.commands.get(id)
    if (!command) return { executed: false, reason: 'missing' }
    if (command.isEnabled && !command.isEnabled(context)) return { executed: false, reason: 'disabled' }
    command.execute(context)
    return { executed: true }
  }
}
