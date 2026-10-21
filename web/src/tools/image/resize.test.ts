import { unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { zipFiles } from './compress.ts'
import { formatBytes, outputName, savingsLabel, targetSize, uniqueZipNames } from './resize.ts'

describe('targetSize', () => {
  it('fits inside a max box and keeps the aspect ratio', () => {
    expect(targetSize(100, 50, { mode: 'max', maxWidth: 50, maxHeight: 50 })).toEqual({
      width: 50,
      height: 25,
    })
  })

  it('does not enlarge when the max is larger than the image', () => {
    expect(targetSize(40, 20, { mode: 'max', maxWidth: 800, maxHeight: null })).toEqual({
      width: 40,
      height: 20,
    })
  })

  it('scales by percent', () => {
    expect(targetSize(100, 40, { mode: 'percent', percent: 50 })).toEqual({ width: 50, height: 20 })
  })
})

describe('image labels', () => {
  it('names the converted file and describes the size change', () => {
    expect(outputName('My.Photo.JPEG', 'webp')).toBe('My.Photo.webp')
    expect(outputName('scan', 'jpeg')).toBe('scan.jpg')
    expect(savingsLabel(1000, 400)).toBe('60% smaller')
    expect(savingsLabel(100, 150)).toBe('50% larger')
    expect(savingsLabel(100, 100)).toBe('same size')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('renames duplicate zip entries', () => {
    expect(uniqueZipNames(['a.jpg', 'a.jpg', 'b.png'])).toEqual(['a.jpg', 'a-2.jpg', 'b.png'])
  })
})

describe('zipFiles', () => {
  it('packs each file under a unique name', async () => {
    const blob = zipFiles([
      { name: 'a.jpg', data: new Uint8Array([1, 2, 3]) },
      { name: 'a.jpg', data: new Uint8Array([4]) },
    ])
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()))
    expect(Object.keys(files).sort()).toEqual(['a-2.jpg', 'a.jpg'])
    expect(Array.from(files['a.jpg'] ?? [])).toEqual([1, 2, 3])
  })
})
