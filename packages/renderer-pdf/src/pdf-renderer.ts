import { ConnectorController, projectVisibleDocument, type CanvasNode, type CanvasScene } from '@canvaskit/core'

export interface PDFRenderOptions { width?: number; height?: number }

export function renderPDF(scene: CanvasScene, options: PDFRenderOptions = {}): Uint8Array {
  const width = options.width ?? 1200
  const height = options.height ?? 720
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('PDF page dimensions must be finite positive numbers.')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${number(width)} ${number(height)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    streamObject(renderContent(scene, width, height)),
  ]
  return writePDF(objects)
}

function renderContent(scene: CanvasScene, width: number, height: number): string {
  const projection = projectVisibleDocument(scene)
  const context = { width, height, viewport: scene.viewport }
  const stream = projection.nodes.map((node) => renderNode(node, context))
  const connectors = new ConnectorController()
  for (const connector of projection.connectors) {
    const route = connectors.route(scene, connector).map((point) => pointToPDF(point.x, point.y, context))
    if (route.length > 1) {
      stream.push(`${point(route[0]!)} m`)
      stream.push(...route.slice(1).map((entry) => `${point(entry)} l`))
      stream.push('0.45 0.48 0.53 RG 1.5 w S')
    }
    if (connector.label && route[0]) stream.push(textOperator(connector.label, route[0].x, route[0].y + 12, 12, '#737B88'))
  }
  return stream.filter(Boolean).join('\n')
}

function renderNode(node: CanvasNode, context: RenderContext): string {
  const { viewport } = context
  let content: string
  if (node.type === 'rectangle') {
    const origin = pointToPDF(node.position.x, node.position.y + node.size.height, context)
    content = `${color(node.fill)} rg\n${number(origin.x)} ${number(origin.y)} ${number(node.size.width * viewport.zoom)} ${number(node.size.height * viewport.zoom)} re f`
    return rotateNodeContent(content, node, context)
  }
  if (node.type === 'circle') {
    const center = pointToPDF(node.position.x, node.position.y, context)
    const radius = node.radius * viewport.zoom
    const curve = radius * 0.5522847498
    content = `${color(node.fill)} rg\n${number(center.x + radius)} ${number(center.y)} m ${number(center.x + radius)} ${number(center.y + curve)} ${number(center.x + curve)} ${number(center.y + radius)} ${number(center.x)} ${number(center.y + radius)} c ${number(center.x - curve)} ${number(center.y + radius)} ${number(center.x - radius)} ${number(center.y + curve)} ${number(center.x - radius)} ${number(center.y)} c ${number(center.x - radius)} ${number(center.y - curve)} ${number(center.x - curve)} ${number(center.y - radius)} ${number(center.x)} ${number(center.y - radius)} c ${number(center.x + curve)} ${number(center.y - radius)} ${number(center.x + radius)} ${number(center.y - curve)} ${number(center.x + radius)} ${number(center.y)} c f`
    return rotateNodeContent(content, node, context)
  }
  if (node.type === 'image') {
    const origin = pointToPDF(node.position.x, node.position.y + node.size.height, context)
    content = `0.2 0.24 0.3 RG 1 w\n${number(origin.x)} ${number(origin.y)} ${number(node.size.width * viewport.zoom)} ${number(node.size.height * viewport.zoom)} re S\n${textOperator(`Image: ${node.assetId}`, origin.x + 6, origin.y + 16, 11, '#F4F6F8')}`
    return rotateNodeContent(content, node, context)
  }
  const location = pointToPDF(node.position.x, node.position.y, context)
  return rotateNodeContent(textOperator(node.text, location.x, location.y, node.fontSize * viewport.zoom, node.fill), node, context)
}

function rotateNodeContent(content: string, node: CanvasNode, context: RenderContext): string {
  if (!node.rotation) return content
  const bounds = node.type === 'circle'
    ? { x: node.position.x - node.radius, y: node.position.y - node.radius, width: node.radius * 2, height: node.radius * 2 }
    : node.type === 'text'
      ? { x: node.position.x, y: node.position.y - node.fontSize, width: node.text.length * node.fontSize, height: node.fontSize }
      : { ...node.position, ...node.size }
  const center = pointToPDF(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, context)
  const cosine = Math.cos(-node.rotation)
  const sine = Math.sin(-node.rotation)
  return `q\n1 0 0 1 ${number(center.x)} ${number(center.y)} cm\n${number(cosine)} ${number(sine)} ${number(-sine)} ${number(cosine)} 0 0 cm\n1 0 0 1 ${number(-center.x)} ${number(-center.y)} cm\n${content}\nQ`
}

interface RenderContext { width: number; height: number; viewport: CanvasScene['viewport'] }

function pointToPDF(x: number, y: number, context: RenderContext): { x: number; y: number } {
  return { x: x * context.viewport.zoom + context.viewport.x, y: context.height - (y * context.viewport.zoom + context.viewport.y) }
}
function point(value: { x: number; y: number }): string { return `${number(value.x)} ${number(value.y)}` }
function textOperator(value: string, x: number, y: number, size: number, fill: string): string { return `BT\n${color(fill)} rg\n/F1 ${number(size)} Tf\n${number(x)} ${number(y)} Td\n(${escapePDF(value)}) Tj\nET` }
function escapePDF(value: string): string { return value.replace(/([\\()])/g, '\\$1').replace(/[\r\n]/g, ' ') }
function color(value: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(value)
  if (!match) return '0 0 0'
  const source = match[1]!
  return [0, 2, 4].map((index) => number(Number.parseInt(source.slice(index, index + 2), 16) / 255)).join(' ')
}
function streamObject(content: string): string { return `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream` }

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
