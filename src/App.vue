<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CanvasClass } from './lib/utils/canvas/Canvas'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
let canvasInstance: CanvasClass | null = null

onMounted(async () => {
  if (!canvasEl.value) return

  // Initialize canvas
  canvasInstance = new CanvasClass(canvasEl.value)

  canvasInstance.createRectangle()

  // Create a few frames to demonstrate
  canvasInstance.createFrame()
  canvasInstance.createFrame({ left: 400, top: 50, width: 300, height: 200 })
  canvasInstance.createFrame({ left: 50, top: 300, width: 300, height: 200 })

  // Enable drag and drop on the canvas container
  if (canvasContainer.value) {
    canvasInstance.enableDragAndDrop(canvasContainer.value)
  }

  // Enable clipboard paste
  canvasInstance.enableClipboardPaste()
})
</script>

<template>
  <div class="canvas-container" ref="canvasContainer">
    <h2>Fabric.js Canvas Demo</h2>
    <canvas ref="canvasEl" width="2000px" height="2000px"></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  padding: 20px;
  text-align: center;
  height: 100vh;
}

.instructions {
  margin: 10px 0 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.instructions p {
  margin: 5px 0;
}

canvas {
  border: 2px solid #ddd;
  background-color: #fafafa;
  display: block;
  margin: 0 auto;
  cursor: default;
}
</style>
