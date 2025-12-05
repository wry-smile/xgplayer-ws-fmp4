import type Player from 'xgplayer/es/player'
import type { Logger } from './logger'
import type { FMp4WsClientOptions } from './types'
import { createLogger } from './logger'
import { MediaSegmentMerger } from './media-segment-merger'

export class FMp4WsClient {
  ws: WebSocket

  binaryType: BinaryType = 'arraybuffer'

  options: FMp4WsClientOptions

  private readonly maxReconnectAttempts: number

  private readonly reconnectDelayMs: number

  private reconnectAttempts = 0

  private reconnectTimer: number | undefined

  private destroyed = false

  private shouldReconnect = true

  protected merger: MediaSegmentMerger

  private wsOpenHandler?: () => void
  private wsMessageHandler?: (event: MessageEvent) => void
  private wsCloseHandler?: (ev: CloseEvent) => void
  private wsErrorHandler?: (err: Event) => void

  private readonly logger: Logger

  private readonly player: Player

  constructor(options: FMp4WsClientOptions) {
    const {
      url,
      el,
      targetLatencySeconds = 2,
      maxBufferSeconds = 20,
      backBufferSeconds = 10,
      maxQueueSize = 50,
      maxQueueBytes = 4 * 1024 * 1024,
      maxReconnectAttempts = 3,
      reconnectDelayMs = 1000,
    } = options
    this.options = options

    this.player = options.player

    this.logger = createLogger({ enabled: !!options.debug, scope: 'Ws Client' })
    this.maxReconnectAttempts = maxReconnectAttempts
    this.reconnectDelayMs = reconnectDelayMs

    const player = typeof el === 'string'
      ? (document.getElementById(el) as HTMLVideoElement)
      : el

    this.merger = new MediaSegmentMerger(player, {
      targetLatencySeconds,
      maxBufferSeconds,
      backBufferSeconds,
      maxQueueSize,
      maxQueueBytes,
      onStats: options.onStats,
      debug: options.debug,
      mergeThresholdCount: options.mergeThresholdCount,
      mergeThresholdBytes: options.mergeThresholdBytes,
      codecStringOverride: options.codecStringOverride,
      enableTypeSupportCheck: options.enableTypeSupportCheck,
      onSourceBufferReady: () => {
        if (this.player.config.autoplay) {
          this.player.play()
        }
        this.markMediaReadySuccess()
      },
      onMergerError: (error) => {
        this.logger.error('MediaSegmentMerger error:', error)
        this.handleMergerError(error)
      },
    })

    this.logger.debug('connect start', url)
    this.ws = this.createWebSocket(url)
  }

  private createWebSocket(url: string): WebSocket {
    const ws = new WebSocket(url)
    ws.binaryType = this.binaryType

    if (this.ws && this.ws !== ws) {
      try {
        if (this.wsOpenHandler)
          this.ws.removeEventListener('open', this.wsOpenHandler)
        if (this.wsMessageHandler)
          this.ws.removeEventListener('message', this.wsMessageHandler as EventListener)
        if (this.wsCloseHandler)
          this.ws.removeEventListener('close', this.wsCloseHandler as EventListener)
        if (this.wsErrorHandler)
          this.ws.removeEventListener('error', this.wsErrorHandler as EventListener)
      }
      catch { }
    }

    this.wsOpenHandler = () => {
      if (this.destroyed)
        return
      this.logger.debug('ws open')

      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer)
        this.reconnectTimer = undefined
      }
    }

    this.wsMessageHandler = (event: MessageEvent) => {
      if (this.destroyed)
        return
      this.onMessage(event as MessageEvent<ArrayBuffer>)
    }

    this.wsCloseHandler = (ev: CloseEvent) => {
      if (this.destroyed) {
        this.logger.debug('ws close after destroyed, ignore')
        return
      }
      this.logger.warn('ws close', { code: ev.code, reason: ev.reason })
      if (this.shouldReconnect) {
        this.tryReconnect(url)
      }
      else {
        this.logger.debug('skip reconnect: shouldReconnect=false')
      }
    }

    this.wsErrorHandler = (err: Event) => {
      if (this.destroyed)
        return
      this.logger.error('ws error', err)
    }

    ws.addEventListener('open', this.wsOpenHandler)
    ws.addEventListener('message', this.wsMessageHandler as EventListener)
    ws.addEventListener('close', this.wsCloseHandler as EventListener)
    ws.addEventListener('error', this.wsErrorHandler)

    return ws
  }

  private tryReconnect(url: string) {
    if (this.destroyed)
      return
    if (!this.shouldReconnect)
      return
    if (this.maxReconnectAttempts <= 0)
      return

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.warn('reach maxReconnectAttempts, stop auto reconnect', { attempts: this.reconnectAttempts })
      this.shouldReconnect = false

      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer)
        this.reconnectTimer = undefined
      }

      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        try {
          this.ws.close()
        }
        catch {

        }
      }

      this.options.onReconnectFailed?.(this.reconnectAttempts)
      return
    }

    this.reconnectAttempts += 1
    const delay = this.reconnectDelayMs * (2 ** (this.reconnectAttempts - 1))

    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined
      if (this.destroyed || !this.shouldReconnect) {
        this.logger.debug('skip reconnect in timer: destroyed or shouldReconnect=false')
        return
      }
      this.ws = this.createWebSocket(url)
    }, delay)
  }

  onMessage(event: MessageEvent<ArrayBuffer>) {
    const segment = event.data
    this.merger.handleSegment(segment)
  }

  private markMediaReadySuccess() {
    if (this.destroyed)
      return
    const wasReconnecting = this.reconnectAttempts > 0

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    if (wasReconnecting) {
      this.logger.debug('reconnect success (media ready)')
      this.options.onReconnectSuccess?.()
    }

    this.reconnectAttempts = 0
  }

  private handleMergerError(error: Error) {
    this.logger.error('Handling merger error, closing WebSocket', error)

    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close()
    }
  }

  /**
   * @description 手动触发一次重连
   */
  reconnect() {
    const { url } = this.options
    if (!url)
      return

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    this.shouldReconnect = true
    this.reconnectAttempts = 0

    if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
      this.ws.close()
    }

    this.ws = this.createWebSocket(url)
  }

  destroy() {
    this.destroyed = true
    this.shouldReconnect = false

    try {
      if (this.ws) {
        if (this.wsOpenHandler)
          this.ws.removeEventListener('open', this.wsOpenHandler)
        if (this.wsMessageHandler)
          this.ws.removeEventListener('message', this.wsMessageHandler as EventListener)
        if (this.wsCloseHandler)
          this.ws.removeEventListener('close', this.wsCloseHandler as EventListener)
        if (this.wsErrorHandler)
          this.ws.removeEventListener('error', this.wsErrorHandler as EventListener)
      }
    }
    catch { }

    this.wsOpenHandler = undefined
    this.wsMessageHandler = undefined
    this.wsCloseHandler = undefined
    this.wsErrorHandler = undefined

    this.merger.destroy()

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        this.ws.close()
      }
    }
    catch { }

    this.ws = null as unknown as WebSocket
  }
}
