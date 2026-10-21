import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type ToolDefinition = {
  id: string
  path: string
  name: string
  short: string
  summary: string
  where: string
  local: boolean
  Component: LazyExoticComponent<ComponentType>
}

export const tools: ToolDefinition[] = [
  {
    id: 'pdf-to-md',
    path: '/pdf-to-md',
    name: 'PDF to Markdown',
    short: 'PDF',
    summary: 'Turn a digital PDF into Markdown. The file is sent to the converter for that request.',
    where: 'Uses the server',
    local: false,
    Component: lazy(() => import('./pdf/PdfTool.tsx')),
  },
  {
    id: 'qr',
    path: '/qr',
    name: 'QR code',
    short: 'QR',
    summary: 'URL, text, Wi-Fi, or a contact. The code is built on this device.',
    where: 'On this device',
    local: true,
    Component: lazy(() => import('./qr/QrTool.tsx')),
  },
  {
    id: 'image',
    path: '/image',
    name: 'Image compress & convert',
    short: 'Images',
    summary: 'JPG, PNG, and WebP. Resize, compare sizes, and download a zip. Images stay on this device.',
    where: 'On this device',
    local: true,
    Component: lazy(() => import('./image/ImageTool.tsx')),
  },
  {
    id: 'json',
    path: '/json',
    name: 'JSON formatter',
    short: 'JSON',
    summary: 'Format, validate, and convert JSON, YAML, and CSV. Text stays on this device.',
    where: 'On this device',
    local: true,
    Component: lazy(() => import('./json/JsonTool.tsx')),
  },
  {
    id: 'time',
    path: '/time',
    name: 'Timestamp & time zones',
    short: 'Time',
    summary: 'Unix time, ISO 8601, and time zones, including Kuala Lumpur. Nothing is uploaded.',
    where: 'On this device',
    local: true,
    Component: lazy(() => import('./time/TimeTool.tsx')),
  },
  {
    id: 'diff',
    path: '/diff',
    name: 'Text diff',
    short: 'Diff',
    summary: 'Side by side or inline, down to a word or a character. Text stays on this device.',
    where: 'On this device',
    local: true,
    Component: lazy(() => import('./diff/DiffTool.tsx')),
  },
]

export function toolByPath(path: string) {
  return tools.find((tool) => tool.path === path)
}
