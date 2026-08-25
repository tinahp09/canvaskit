/**
 * Serializes a rendered canvas as a PNG data URL without initiating a download.
 */
export function exportPNG(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL('image/png')
  } catch {
    throw new Error('Unable to export canvas as PNG.')
  }
}
