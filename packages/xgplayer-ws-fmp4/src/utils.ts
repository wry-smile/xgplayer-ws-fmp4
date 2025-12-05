import type { IUrl } from 'xgplayer/es/defaultConfig'

export function isWsUrl(url: unknown): url is string {
  return typeof url === 'string' && (url.startsWith('ws://') || url.startsWith('wss://'))
}

export function isBlobUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('blob:')
}

export function isMediaStream(input: unknown): input is MediaStream {
  return typeof MediaStream !== 'undefined' && input instanceof MediaStream
}

export function extractStringUrl(url: IUrl): string | undefined {
  if (typeof url === 'string')
    return url
  if (isMediaStream(url))
    return undefined
  if (Array.isArray(url)) {
    const item = url.find(item => typeof (item as any)?.src === 'string') as any
    return item?.src
  }
  return undefined
}
