<script setup lang="ts">
import { ref } from 'vue'
import { addRectangle, createScene } from '@canvaskit/core'
import { CanvasKitCanvas, useCanvasKit, useCanvasScene } from '@canvaskit/vue'
import { exportPNG } from '@canvaskit/renderer-canvas'
import { renderSVG } from '@canvaskit/renderer-svg'

const canvas = useCanvasKit()
canvas.setScene(addRectangle(createScene(), {
  id: 'welcome',
  position: { x: 260, y: 180 },
  size: { width: 260, height: 120 },
  fill: '#7c7ff2',
}))

const scene = useCanvasScene()
const host = ref<HTMLElement | null>(null)
const exportPreview = ref('')
const status = ref(`Nodes: ${scene.value.nodes.length}`)

const exportSvg = () => { exportPreview.value = renderSVG(scene.value); status.value = 'SVG exported.' }
const exportPng = () => {
  const element = host.value?.querySelector('canvas')
  if (element) { exportPreview.value = exportPNG(element); status.value = 'PNG exported.' }
}
</script>

<template>
  <main ref="host">
    <header>
      <strong>CanvasKit Vue</strong>
      <p role="status" aria-live="polite">{{ status }}</p>
      <div class="toolbar" aria-label="Export controls">
        <button type="button" @click="exportSvg">Export SVG</button>
        <button type="button" @click="exportPng">Export PNG</button>
      </div>
    </header>
    <CanvasKitCanvas :width="960" :height="540" />
    <label class="preview-label">
      Export preview
      <textarea v-model="exportPreview" readonly />
    </label>
  </main>
</template>
