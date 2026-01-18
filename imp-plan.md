# Implementation Plan: Image Frames with Upload Functionality

## Overview

Add frame creation and image upload capabilities to your `CanvasClass`, allowing users to create card-like frames with box shadows and add images via file upload, drag & drop, and clipboard paste.

---

## 1. Data Structure & State Management

### Frame-Image Tracking

```typescript
interface FrameData {
  frame: Rect           // The Fabric.js rectangle object
  image: FabricImage | null  // The current image in the frame (null if empty)
  placeholder?: FabricText   // Optional "Click to add image" text
}

// In CanvasClass:
private frames: Map<string, FrameData> = new Map()
```

**Why this approach:**

- Each frame gets a unique ID (using Fabric's object ID or custom UUID)
- Tracks one-to-one relationship between frames and images
- Easy to find which frame contains which image
- Placeholder text for empty frames improves UX

---

## 2. Canvas.ts Implementation Details

### A. Frame Creation Method

```typescript
createFrame(options?: {
  left?: number
  top?: number
  width?: number
  height?: number
  label?: string
}): Rect
```

**Implementation details:**

- **Card-like styling:**
  - Background: `#ffffff` or light gray
  - Border: `2px solid #e0e0e0` (subtle border)
  - Shadow: Use Fabric.js `shadow` property with values like:
    ```typescript
    shadow: new Shadow({
      color: 'rgba(0,0,0,0.15)',
      blur: 10,
      offsetX: 0,
      offsetY: 4,
    })
    ```
  - Rounded corners: `rx: 8, ry: 8`

- **Default dimensions:** 300x200 pixels
- **Interactive properties:**
  - `selectable: true` - can be selected
  - `hasControls: true` - can be resized
  - `lockRotation: true` - prevent rotation for cleaner UX

- **Placeholder text:**
  - Display "Click to add image" centered in frame
  - Remove when image is added
  - Re-add if image is removed

- **Click handler:**
  - On frame click, trigger file picker for that specific frame
  - Store frame reference to know where to place selected image

---

### B. Image Upload Methods

#### i. File Input Upload

```typescript
async addImageFromFile(file: File, targetFrame?: Rect): Promise<FabricImage | null>
```

**Steps:**

1. Validate file type (check `file.type.startsWith('image/')`)
2. Create FileReader to read file as Data URL
3. Use `FabricImage.fromURL(dataURL)` to create image
4. If `targetFrame` provided, call `fitImageToFrame()`
5. If no frame, add image at canvas center
6. Update `frames` Map to track the relationship
7. Error handling for invalid files

#### ii. Drag & Drop

```typescript
enableDragAndDrop(dropZone?: HTMLElement): void
```

**Implementation:**

1. Attach listeners to canvas container or custom dropZone
2. Events to handle:
   - `dragover` - Prevent default and show visual feedback
   - `dragleave` - Remove visual feedback
   - `drop` - Extract files from `e.dataTransfer.files`

3. **Frame detection on drop:**
   - Get drop coordinates relative to canvas
   - Use `canvas.getPointer(e)` to get canvas coordinates
   - Iterate through frames to check if point is inside frame bounds
   - If over frame, add image to that frame
   - If not over frame, add image at drop position

4. **Visual feedback:**
   - Highlight frame when hovering over it during drag
   - Change cursor or add overlay

#### iii. Clipboard Paste

```typescript
enableClipboardPaste(): void
```

**Implementation:**

1. Add `paste` event listener to document/window
2. Extract image from `e.clipboardData.items`
3. Filter for items with `type.startsWith('image/')`
4. Use `item.getAsFile()` to get File object
5. Pass to `addImageFromFile()` method
6. Add image at canvas center (no specific frame unless one is selected)

**Selection-aware paste:**

- If a frame is currently selected (`canvas.getActiveObject()`), paste into that frame
- Otherwise, paste at canvas center

---

### C. Image Fitting Logic

```typescript
fitImageToFrame(image: FabricImage, frame: Rect, mode: 'cover' = 'cover'): void
```

**Cover mode implementation (default as requested):**

1. Get frame dimensions (width, height)
2. Get image natural dimensions
3. Calculate scale ratios:

   ```typescript
   const frameRatio = frame.width / frame.height
   const imageRatio = image.width / image.height

   let scale: number
   if (imageRatio > frameRatio) {
     // Image is wider - scale to frame height
     scale = frame.height / image.height
   } else {
     // Image is taller - scale to frame width
     scale = frame.width / image.width
   }
   ```

4. Apply scale: `image.scale(scale)`
5. Center image within frame:
   ```typescript
   image.set({
     left: frame.left + (frame.width - image.width * scale) / 2,
     top: frame.top + (frame.height - image.height * scale) / 2,
   })
   ```
6. **Important:** Set image `clipPath` to frame bounds for clean edges:
   ```typescript
   image.clipPath = new Rect({
     left: frame.left,
     top: frame.top,
     width: frame.width,
     height: frame.height,
     absolutePositioned: true,
   })
   ```

---

### D. Frame Click Handler

```typescript
private setupFrameClickHandler(frame: Rect): void
```

**Implementation:**

1. Add click event to frame:

   ```typescript
   frame.on('mousedown', (e) => {
     if (e.button === 1) {
       // Left click
       this.openFilePickerForFrame(frame)
     }
   })
   ```

2. Create hidden file input element:

   ```typescript
   private createFileInput(): HTMLInputElement {
     const input = document.createElement('input')
     input.type = 'file'
     input.accept = 'image/*'
     input.style.display = 'none'
     return input
   }
   ```

3. Trigger file picker:
   ```typescript
   private openFilePickerForFrame(frame: Rect): void {
     const input = this.createFileInput()
     input.onchange = async (e) => {
       const file = (e.target as HTMLInputElement).files?.[0]
       if (file) {
         await this.addImageFromFile(file, frame)
       }
     }
     input.click()
   }
   ```

---

### E. Helper Methods

```typescript
// Remove image from frame
removeImageFromFrame(frame: Rect): void {
  const frameData = this.frames.get(frame.id)
  if (frameData?.image) {
    this.canvas.remove(frameData.image)
    frameData.image = null
    // Re-add placeholder
  }
}

// Get frame at specific position (for drag & drop)
private getFrameAtPosition(x: number, y: number): Rect | null {
  for (const [id, data] of this.frames) {
    const frame = data.frame
    if (
      x >= frame.left &&
      x <= frame.left + frame.width &&
      y >= frame.top &&
      y <= frame.top + frame.height
    ) {
      return frame
    }
  }
  return null
}

// Check if point is inside frame
private isPointInFrame(frame: Rect, x: number, y: number): boolean {
  return (
    x >= frame.left &&
    x <= frame.left + frame.width &&
    y >= frame.top &&
    y <= frame.top + frame.height
  )
}
```

---

## 3. Updated Canvas.ts Full API

```typescript
export class CanvasClass {
  canvas: Canvas
  private frames: Map<string, FrameData>
  private fileInput: HTMLInputElement | null

  constructor(canvas: HTMLCanvasElement)

  // Existing methods
  createRectangle(): void

  // New frame methods
  createFrame(options?: FrameOptions): Rect

  // Image methods
  addImageFromFile(file: File, targetFrame?: Rect): Promise<FabricImage | null>
  addImageFromURL(url: string, targetFrame?: Rect): Promise<FabricImage | null>
  removeImageFromFrame(frame: Rect): void

  // Fitting
  fitImageToFrame(image: FabricImage, frame: Rect, mode?: 'cover'): void

  // Upload enablers
  enableDragAndDrop(dropZone?: HTMLElement): void
  enableClipboardPaste(): void

  // Private helpers
  private setupFrameClickHandler(frame: Rect): void
  private openFilePickerForFrame(frame: Rect): void
  private getFrameAtPosition(x: number, y: number): Rect | null
  private createFileInput(): HTMLInputElement
}
```

---

## 4. App.vue Integration Example

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CanvasClass } from './lib/utils/canvas/Canvas'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
let canvasInstance: CanvasClass | null = null

onMounted(() => {
  if (!canvasEl.value) return

  canvasInstance = new CanvasClass(canvasEl.value)

  // Create a few frames
  canvasInstance.createFrame({ left: 50, top: 50, width: 300, height: 200 })
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
    <div class="instructions">
      <p>Click a frame to upload an image</p>
      <p>Drag & drop images onto frames</p>
      <p>Copy an image and paste (Ctrl/Cmd+V)</p>
    </div>
    <canvas ref="canvasEl" width="800" height="600"></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  padding: 20px;
  text-align: center;
}

.instructions {
  margin: 10px 0;
  color: #666;
  font-size: 14px;
}

canvas {
  border: 2px solid #ddd;
  background-color: #fafafa;
  display: block;
  margin: 0 auto;
}
</style>
```

---

## 5. Implementation Order

1. **Phase 1: Basic Frame Creation**
   - Add `createFrame()` method
   - Implement card styling with box shadow
   - Add placeholder text
   - Test frame creation and positioning

2. **Phase 2: File Upload**
   - Implement `addImageFromFile()`
   - Add click handler to frames
   - Implement file picker trigger
   - Test image loading and basic placement

3. **Phase 3: Image Fitting**
   - Implement `fitImageToFrame()` with cover mode
   - Add clipping to keep images within frame bounds
   - Handle frame-image relationship tracking
   - Test scaling and positioning

4. **Phase 4: Drag & Drop**
   - Implement `enableDragAndDrop()`
   - Add frame detection on drop
   - Add visual feedback during drag
   - Test dropping images on frames

5. **Phase 5: Clipboard Paste**
   - Implement `enableClipboardPaste()`
   - Handle selection-aware pasting
   - Test paste functionality

6. **Phase 6: Polish & Edge Cases**
   - Handle replacing existing images in frames
   - Add error handling for invalid files
   - Add loading states for async operations
   - Test edge cases (large images, small frames, etc.)

---

## 6. Technical Considerations

### TypeScript Types

```typescript
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

type FitMode = 'cover' | 'contain' | 'stretch'
```

### Error Handling

- Invalid file types
- Failed image loading
- Missing canvas element
- Drag & drop browser compatibility

### Browser Compatibility

- FileReader API (widely supported)
- Clipboard API (check `navigator.clipboard` availability)
- Drag & Drop API (widely supported, but handle mobile separately)

### Performance

- Lazy load images (already handled by `FabricImage.fromURL`)
- Limit max image dimensions if needed
- Consider image compression for large files
- Dispose of replaced images properly

---

## 7. Questions / Clarifications Needed

Before implementation, I'd like to confirm:

1. **Frame styling details:**
   - Background color for empty frames? (white, light gray, or transparent?)
   - Should frames show a dashed border when empty vs solid when filled?

2. **Image behavior:**
   - Should images be locked to frames (move together) or independent?
   - Should users be able to adjust image position/zoom within frame after placing?

3. **Placeholder:**
   - Text only ("Click to add image") or should we add an icon (📷, ➕)?
   - Style preference for placeholder text?

4. **Validation:**
   - Maximum file size limit for uploads?
   - Specific image formats only (jpg, png, gif, webp)?

5. **Mobile support:**
   - Do we need to handle mobile touch events for image selection?
   - File upload on mobile (camera access)?

---

This plan provides a comprehensive, step-by-step approach to implementing your frame and image upload system. Once you confirm the clarifications and give the go-ahead, I'll implement this systematically following the phased approach.
