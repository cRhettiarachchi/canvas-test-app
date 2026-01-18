import { Canvas, Rect, FabricImage, FabricText, Shadow } from 'fabric'

interface FrameOptions {
  left?: number
  top?: number
  width?: number
  height?: number
  label?: string
}

interface FrameData {
  frame: Rect
  image: FabricImage | null
  placeholder?: FabricText
}

export class CanvasClass {
  canvas: Canvas
  private frames: Map<string, FrameData> = new Map()
  private fileInput: HTMLInputElement | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = new Canvas(canvas)
  }

  createRectangle = () => {
    const rect = new Rect({
      left: 200,
      top: 200,
      width: 150,
      height: 100,
      fill: 'black',
      stroke: '#2E7D32',
      strokeWidth: 1,
      selectable: true,
      hasControls: true,
      lockRotation: true,
    })

    this.canvas.add(rect)
  }

  createFrame = (options?: FrameOptions): Rect => {
    const defaultOptions = {
      left: 200,
      top: 200,
      width: 300,
      height: 200,
      label: 'Click to add image',
    }

    const opts = { ...defaultOptions, ...options }

    // Create the frame rectangle with card-like styling
    const frame = new Rect({
      left: opts.left,
      top: opts.top,
      width: opts.width,
      height: opts.height,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 2,
      rx: 8,
      ry: 8,
      shadow: new Shadow({
        color: 'rgba(0,0,0,0.15)',
        blur: 10,
        offsetX: 0,
        offsetY: 4,
      }),
      selectable: true,
      hasControls: true,
      lockRotation: true,
      lockMovementX: true,
      lockMovementY: true,
    })

    // Create placeholder text
    const placeholder = new FabricText(opts.label, {
      left: opts.left + opts.width / 2,
      top: opts.top + opts.height / 2,
      fontSize: 16,
      fill: '#999999',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    })

    // Add frame and placeholder to canvas
    this.canvas.add(frame)
    this.canvas.add(placeholder)

    // Store frame data
    const frameId = frame.get('id') || `frame-${Date.now()}`

    frame.set('id', frameId)

    this.frames.set(frameId, {
      frame,
      image: null,
      placeholder,
    })

    // Setup click handler for frame
    this.setupFrameClickHandler(frame)

    // Sync placeholder position when frame moves
    frame.on('moving', () => {
      placeholder.set({
        left: frame.left! + opts.width / 2,
        top: frame.top! + opts.height / 2,
      })
      this.canvas.renderAll()
    })

    return frame
  }

  private setupFrameClickHandler = (frame: Rect): void => {
    frame.on('mousedown', (e) => {
      // Double click to open file picker
      if (e.e instanceof MouseEvent && e.e.detail === 2) {
        this.openFilePickerForFrame(frame)
      }
    })
  }

  private createFileInput = (): HTMLInputElement => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    return input
  }

  private openFilePickerForFrame = (frame: Rect): void => {
    const input = this.createFileInput()
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await this.addImageFromFile(file, frame)
      }
    }
    input.click()
  }

  addImageFromFile = async (file: File, targetFrame?: Rect): Promise<FabricImage | null> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type. Please select an image.')
      return null
    }

    try {
      // Create FileReader to read file as Data URL
      const dataURL = await this.readFileAsDataURL(file)

      // Create FabricImage from data URL
      const image = await FabricImage.fromURL(dataURL)

      if (targetFrame) {
        // If target frame is specified, fit image to frame
        this.fitImageToFrame(image, targetFrame)
      } else {
        // Otherwise, add image at canvas center
        image.set({
          left: this.canvas.width! / 2,
          top: this.canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        })
      }

      this.canvas.add(image)
      this.canvas.renderAll()

      return image
    } catch (error) {
      console.error('Failed to load image:', error)
      return null
    }
  }

  private readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  fitImageToFrame = (image: FabricImage, frame: Rect, _mode: 'cover' = 'cover'): void => {
    const frameId = frame.get('id') as string
    const frameData = this.frames.get(frameId)

    if (!frameData) {
      console.error('Frame data not found')
      return
    }

    // Remove existing image if present
    if (frameData.image) {
      this.canvas.remove(frameData.image)
    }

    // Hide placeholder
    if (frameData.placeholder) {
      frameData.placeholder.set('opacity', 0)
    }

    const frameWidth = frame.width!
    const frameHeight = frame.height!
    const frameLeft = frame.left!
    const frameTop = frame.top!

    // Get image dimensions
    const imgWidth = image.width!
    const imgHeight = image.height!

    // Calculate scale for 'cover' mode
    const frameRatio = frameWidth / frameHeight
    const imageRatio = imgWidth / imgHeight

    let scale: number
    if (imageRatio > frameRatio) {
      // Image is wider - scale to frame height
      scale = frameHeight / imgHeight
    } else {
      // Image is taller - scale to frame width
      scale = frameWidth / imgWidth
    }

    // Apply scale
    image.scale(scale)

    // Center image within frame
    image.set({
      left: frameLeft + frameWidth / 2,
      top: frameTop + frameHeight / 2,
      originX: 'center',
      originY: 'center',
    })

    // Set clipPath to frame bounds for clean edges
    const clipPath = new Rect({
      left: frameLeft,
      top: frameTop,
      width: frameWidth,
      height: frameHeight,
      absolutePositioned: true,
    })
    image.set('clipPath', clipPath)

    // Update frame data
    frameData.image = image

    this.canvas.renderAll()
  }

  enableDragAndDrop = (dropZone?: HTMLElement): void => {
    const zone = dropZone || this.canvas.wrapperEl

    if (!zone) {
      console.error('No drop zone element found')
      return
    }

    zone.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
      zone.style.opacity = '0.7'
    })

    zone.addEventListener('dragleave', (e) => {
      e.preventDefault()
      e.stopPropagation()
      zone.style.opacity = '1'
    })

    zone.addEventListener('drop', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      zone.style.opacity = '1'

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file || !file.type.startsWith('image/')) {
        console.error('Invalid file type')
        return
      }

      // Get drop coordinates relative to canvas
      const rect = this.canvas.upperCanvasEl.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if dropped on a frame
      const targetFrame = this.getFrameAtPosition(x, y)

      await this.addImageFromFile(file, targetFrame || undefined)
    })
  }

  private getFrameAtPosition = (x: number, y: number): Rect | null => {
    for (const [, data] of this.frames) {
      const frame = data.frame
      const frameLeft = frame.left!
      const frameTop = frame.top!
      const frameWidth = frame.width!
      const frameHeight = frame.height!

      if (
        x >= frameLeft &&
        x <= frameLeft + frameWidth &&
        y >= frameTop &&
        y <= frameTop + frameHeight
      ) {
        return frame
      }
    }
    return null
  }

  enableClipboardPaste = (): void => {
    window.addEventListener('paste', async (e) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item && item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            // Check if a frame is selected
            const activeObject = this.canvas.getActiveObject()
            let targetFrame: Rect | undefined

            if (activeObject && activeObject instanceof Rect) {
              // Check if active object is a frame
              const frameId = activeObject.get('id') as string
              if (this.frames.has(frameId)) {
                targetFrame = activeObject
              }
            }

            await this.addImageFromFile(file, targetFrame)
          }
        }
      }
    })
  }

  removeImageFromFrame = (frame: Rect): void => {
    const frameId = frame.get('id') as string
    const frameData = this.frames.get(frameId)

    if (frameData?.image) {
      this.canvas.remove(frameData.image)
      frameData.image = null

      // Show placeholder again
      if (frameData.placeholder) {
        frameData.placeholder.set('opacity', 1)
      }

      this.canvas.renderAll()
    }
  }

  addImageFromURL = async (url: string, targetFrame?: Rect): Promise<FabricImage | null> => {
    try {
      const image = await FabricImage.fromURL(url)

      if (targetFrame) {
        this.fitImageToFrame(image, targetFrame)
      } else {
        image.set({
          left: this.canvas.width! / 2,
          top: this.canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        })
      }

      this.canvas.add(image)
      this.canvas.renderAll()

      return image
    } catch (error) {
      console.error('Failed to load image from URL:', error)
      return null
    }
  }
}
