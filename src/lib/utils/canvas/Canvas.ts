import { Canvas, Rect } from 'fabric'

export class CanvasClass {
  canvas: Canvas

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = new Canvas(canvas)
  }

  createRectangle = () => {
    const rect = new Rect({
      left: 200,
      top: 200,
      width: 150,
      height: 100,
      fill: '#4CAF50',
      stroke: '#2E7D32',
      strokeWidth: 3,
    })

    this.canvas.add(rect)
  }
}
