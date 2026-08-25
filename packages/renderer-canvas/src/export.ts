/**
 * Serializes a rendered canvas as a PNG data URL without initiating a download.
 */
export function exportPNG(canvas: HTMLCanvasElement): string {
  try {
    const dataUrl = canvas.toDataURL('image/png')
    if (!dataUrl.startsWith('data:image/png')) throw new Error('Canvas did not produce PNG data.')
    return dataUrl
  } catch {
    throw new Error('Unable to export canvas as PNG.')
  }
}
