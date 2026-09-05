/** A host-owned, storage-neutral persisted CanvasKit document. */
export interface StoredDocument {
  readonly id: string
  readonly title: string
  readonly scene: string
  readonly updatedAt: string
  readonly revision?: string
}

/** Storage boundary implemented by an application, never by Core. */
export interface DocumentStorageAdapter {
  list(): Promise<readonly StoredDocument[]>
  load(id: string): Promise<StoredDocument | undefined>
  save(document: StoredDocument): Promise<StoredDocument>
}

export type DocumentPersistenceStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'
