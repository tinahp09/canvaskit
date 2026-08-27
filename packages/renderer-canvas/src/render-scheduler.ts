export class RenderScheduler {
  private frame: number | undefined
  private latestRender: (() => void) | undefined
  private disposed = false

  schedule(render: () => void): void {
    if (this.disposed) return
    this.latestRender = render

    if (this.frame !== undefined) return
    if (typeof globalThis.requestAnimationFrame !== 'function') {
      this.flush()
      return
    }

    this.frame = globalThis.requestAnimationFrame(() => this.flush())
  }

  dispose(): void {
    this.disposed = true
    if (this.frame !== undefined) globalThis.cancelAnimationFrame(this.frame)
    this.frame = undefined
    this.latestRender = undefined
  }

  private flush(): void {
    this.frame = undefined
    const render = this.latestRender
    this.latestRender = undefined
    render?.()
  }
}
