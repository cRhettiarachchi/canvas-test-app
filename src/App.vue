<script setup lang="ts">
import { StaticCanvas, FabricText, Canvas, Rect, Circle, FabricImage } from 'fabric'
import { onMounted, ref } from 'vue'
import { CanvasClass } from './lib/utils/canvas/canvas'

const canvasEl = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  if (!canvasEl.value) return
  // Initialize interactive canvas
  const fabricCanvas = new CanvasClass(canvasEl.value)

  fabricCanvas.createRectangle()
})
</script>

<template>
  <div class="canvas-container">
    <h2>Fabric.js Canvas Demo</h2>
    <canvas ref="canvasEl" width="800" height="600"></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  padding: 20px;
  text-align: center;
}
canvas {
  border: 2px solid #ddd;
  background-color: #fafafa;
  display: block;
  margin: 0 auto;
}
</style>
