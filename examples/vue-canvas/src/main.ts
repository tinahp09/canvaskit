import { createApp, h } from 'vue'
import { CanvasKitProvider } from '@canvaskit/vue'
import App from './App.vue'
import './style.css'

createApp({
  render: () => h(CanvasKitProvider, null, { default: () => h(App) }),
}).mount('#app')
