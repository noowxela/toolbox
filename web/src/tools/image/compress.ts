import { zipSync } from 'fflate'
import { outputName, targetSize, uniqueZipNames, type ImageFormat, type ResizeOptions } from './resize.ts'

export function mimeFor(format: ImageFormat): string {
  if (format === 'jpeg') return 'image/jpeg'
  if (format === 'png') return 'image/png'
  return 'image/webp'
}

export function zipFiles(files: { name: string; data: Uint8Array }[]): Blob {
  const names = uniqueZipNames(files.map((file) => file.name))
  const entries: Record<string, Uint8Array> = {}
  files.forEach((file, index) => {
    const name = names[index] ?? file.name
    entries[name] = file.data
  })
  const zipped = zipSync(entries, { level: 0 })
  return new Blob([zipped], { type: 'application/zip' })
}

export async function transcodeImage(
  file: File,
  options: { format: ImageFormat; quality: number; resize: ResizeOptions },
): Promise<{ blob: Blob; width: number; height: number; name: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const size = targetSize(bitmap.width, bitmap.height, options.resize)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare a canvas.')
    if (options.format === 'jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, size.width, size.height)
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    const quality = options.format === 'png' ? undefined : Math.min(1, Math.max(0.05, options.quality))
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result)
          else if (options.format === 'webp') {
            reject(new Error('This browser cannot encode WebP. Choose JPG or PNG.'))
          } else reject(new Error('Could not encode that image.'))
        },
        mimeFor(options.format),
        quality,
      )
    })
    return { blob, width: size.width, height: size.height, name: outputName(file.name, options.format) }
  } finally {
    bitmap.close()
  }
}
