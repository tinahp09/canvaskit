import type { CanvasScene } from '@canvaskit/core'

export interface PDFRenderOptions { width?: number; height?: number }

export function renderPDF(_scene: CanvasScene, options: PDFRenderOptions = {}): Uint8Array {
  const width = options.width ?? 1200
  const height = options.height ?? 720
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('PDF page dimensions must be finite positive numbers.')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${number(width)} ${number(height)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ]
  return writePDF(objects)
}

export function exportPDFDataURL(scene: CanvasScene, options?: PDFRenderOptions): string {
  return `data:application/pdf;base64,${toBase64(renderPDF(scene, options))}`
}

function writePDF(objects: readonly string[]): Uint8Array {
  const encoder = new TextEncoder()
  let source = '%PDF-1.4\n%âãÏÓ\n'
  const offsets = [0]
  for (const [index, object] of objects.entries()) {
    offsets.push(encoder.encode(source).length)
    source += `${index + 1} 0 obj\n${object}\nendobj\n`
  }
  const xref = encoder.encode(source).length
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  source += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return encoder.encode(source)
}

function number(value: number): string { return Number(value.toFixed(4)).toString() }

function toBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const value = (bytes[index]! << 16) | ((bytes[index + 1] ?? 0) << 8) | (bytes[index + 2] ?? 0)
    result += chars[(value >>> 18) & 63]!
    result += chars[(value >>> 12) & 63]!
    result += index + 1 < bytes.length ? chars[(value >>> 6) & 63]! : '='
    result += index + 2 < bytes.length ? chars[value & 63]! : '='
  }
  return result
}
