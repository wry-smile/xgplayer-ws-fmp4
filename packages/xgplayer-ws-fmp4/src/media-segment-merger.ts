import type { Movie } from 'mp4box'
import type { Logger } from './logger'
import type { MediaSegmentMergerOptions, Mp4WsConfig } from './types'
import { createFile, MP4BoxBuffer } from 'mp4box'
import { BACK_BUFFER_SECONDS, MAX_BUFFER_SECONDS, MAX_QUEUE_BYTES, MAX_QUEUE_SIZE, TARGET_LATENCY_SECONDS } from './constant'
import { createLogger } from './logger'

/**
 * @description 合并媒体片段
 */
export class MediaSegmentMerger {
  private readonly player: HTMLVideoElement
  private readonly targetLatencySeconds: number
  private readonly maxBufferSeconds: number
  private readonly backBufferSeconds: number
  private readonly maxQueueSize: number
  private readonly maxQueueBytes: number
  private readonly onStats?: Mp4WsConfig['onStats']
  private readonly debug?: boolean

  private readonly mergeThresholdCount?: number
  private readonly mergeThresholdBytes?: number
  private readonly codecStringOverride?: string
  private readonly enableTypeSupportCheck?: boolean
  private readonly onSourceBufferReady?: () => void
  private readonly onMergerError?: (error: Error) => void

  private mediaSource?: MediaSource
  private sourceBuffer?: SourceBuffer
  private isSourceOpen = false
  private objectUrl?: string
  private readonly logger: Logger

  private firstMessage = true
  private hasFirstFrame = false

  private frameQueue: ArrayBuffer[] = []
  private queueBytes = 0

  private placeholderMediaSource?: MediaSource
  private placeholderObjectUrl?: string

  constructor(player: HTMLVideoElement, options: MediaSegmentMergerOptions) {
    this.player = player

    this.placeholderMediaSource = new MediaSource()
    this.placeholderObjectUrl = URL.createObjectURL(this.placeholderMediaSource)
    this.player.src = this.placeholderObjectUrl

    this.targetLatencySeconds = options.targetLatencySeconds ?? TARGET_LATENCY_SECONDS
    this.maxBufferSeconds = options.maxBufferSeconds ?? MAX_BUFFER_SECONDS
    this.backBufferSeconds = options.backBufferSeconds ?? BACK_BUFFER_SECONDS
    this.maxQueueSize = options.maxQueueSize ?? MAX_QUEUE_SIZE
    this.maxQueueBytes = options.maxQueueBytes ?? MAX_QUEUE_BYTES
    this.onStats = options.onStats

    this.debug = options.debug
    this.mergeThresholdCount = options.mergeThresholdCount
    this.mergeThresholdBytes = options.mergeThresholdBytes
    this.codecStringOverride = options.codecStringOverride
    this.enableTypeSupportCheck = options.enableTypeSupportCheck
    this.onSourceBufferReady = options.onSourceBufferReady
    this.onMergerError = options.onMergerError

    this.logger = createLogger({ enabled: !!this.debug, scope: 'MediaSegmentMerger' })
  }

  /**
   * @description 处理片段流
   */
  handleSegment(segment: ArrayBuffer) {
    try {
      if (!segment || segment.byteLength === 0)
        return
      // 队列长度 & 字节数控制：超限时丢弃最旧的帧
      this.frameQueue.push(segment)
      this.queueBytes += segment.byteLength

      while (this.frameQueue.length > this.maxQueueSize || this.queueBytes > this.maxQueueBytes) {
        const dropped = this.frameQueue.shift()
        if (dropped) {
          this.queueBytes -= dropped.byteLength
        }
      }

      if (this.firstMessage) {
        this.firstMessage = false
        const mp4Box = createFile()
        mp4Box.onReady = (info) => {
          this.demuxMoov(info)
        }
        const boxBuffer = MP4BoxBuffer.fromArrayBuffer(segment, 0)
        boxBuffer.fileStart = 0
        mp4Box.appendBuffer(boxBuffer)
      }

      this.flushQueue()
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.logger.error('Error in handleSegment:', err)
      this.handleError(err)
    }
  }

  private flushQueue() {
    if (!this.sourceBuffer || this.sourceBuffer.updating || this.frameQueue.length === 0 || !this.isSourceOpen) {
      return
    }

    try {
      // 在满足阈值时进行合并，否则保持单帧追加
      const mergeByCount = this.mergeThresholdCount != null
        ? this.frameQueue.length >= this.mergeThresholdCount
        : (this.frameQueue.length > 1)
      const mergeByBytes = this.mergeThresholdBytes != null
        ? this.queueBytes >= this.mergeThresholdBytes
        : false
      const shouldMerge = (this.frameQueue.length > 1) && (mergeByCount || mergeByBytes)

      if (!shouldMerge) {
        const frame = this.frameQueue.shift()!
        this.queueBytes -= frame.byteLength
        this.sourceBuffer.appendBuffer(frame)
      }
      else {
        // 多帧时合并成一个大的 Uint8Array 再送入，减少 appendBuffer 调用次数
        const totalByteLength = this.queueBytes
        if (totalByteLength === 0)
          return

        const mergedBuffer = new Uint8Array(totalByteLength)
        let offset = 0
        for (const frame of this.frameQueue) {
          const frameData = new Uint8Array(frame)
          mergedBuffer.set(frameData, offset)
          offset += frame.byteLength
        }

        this.sourceBuffer.appendBuffer(mergedBuffer)
        this.frameQueue.length = 0
        this.queueBytes = 0
      }
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.logger.error('Error in flushQueue:', err)
      this.handleError(err)
    }
  }

  private handleError(error: Error) {
    this.isSourceOpen = false
    try {
      this.destroy()
    }
    catch { }

    this.firstMessage = true
    this.hasFirstFrame = false

    try {
      this.onMergerError?.(error)
    }
    catch (e) {
      this.logger.error('Error in onMergerError callback:', e)
    }
  }

  private cleanupMediaSource() {
    if (this.placeholderMediaSource) {
      try {
        this.placeholderMediaSource.endOfStream()
        this.placeholderMediaSource = undefined
      }
      catch {
        // Noop
      }
    }

    if (this.placeholderObjectUrl) {
      try {
        URL.revokeObjectURL(this.placeholderObjectUrl)
        this.placeholderObjectUrl = undefined
      }
      catch {
        // Noop
      }
    }

    if (this.mediaSource && this.isSourceOpen) {
      try {
        this.mediaSource.endOfStream()
      }
      catch {
        // Noop
      }
    }

    if (this.sourceBuffer) {
      try {
        if (!this.sourceBuffer.updating) {
          this.sourceBuffer.abort()
        }
      }
      catch {
        // Noop
      }
    }

    if (this.objectUrl) {
      try {
        URL.revokeObjectURL(this.objectUrl)
      }
      catch {

      }
      this.objectUrl = undefined
    }

    if (this.player.src && this.player.src.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.player.src)
      }
      catch { }
    }
  }

  private demuxMoov(info: Movie) {
    const codecs = info.tracks.map(track => track.codec)

    this.cleanupMediaSource()

    const mediaSource = new MediaSource()
    this.mediaSource = mediaSource
    this.isSourceOpen = false

    const player = this.player

    const frameObjectUrl = URL.createObjectURL(mediaSource)
    this.objectUrl = frameObjectUrl

    try {
      player.src = frameObjectUrl
    }
    catch (error) {
      this.logger.error('Failed to set player.src:', error)
      return
    }

    mediaSource.onsourceopen = () => {
      if (mediaSource.readyState !== 'open') {
        this.logger.error('MediaSource readyState 不是 open，当前状态:', mediaSource.readyState)
        return
      }

      this.isSourceOpen = true
      try {
        const codecString = this.codecStringOverride ?? codecs.join(', ')
        const mime = `video/mp4; codecs="${codecString}"`
        this.logger.debug('MIME codecs', mime)
        if (this.enableTypeSupportCheck && typeof MediaSource !== 'undefined' && 'isTypeSupported' in MediaSource) {
          try {
            if (!MediaSource.isTypeSupported(mime)) {
              this.logger.warn('MIME 不被支持:', mime)
            }
          }
          catch { }
        }
        this.sourceBuffer = mediaSource.addSourceBuffer(mime)
        this.sourceBuffer.mode = 'segments'

        try {
          this.onSourceBufferReady?.()
        }
        catch { }

        this.sourceBuffer.onerror = (error) => {
          const err = error instanceof Error ? error : new Error('SourceBuffer error')
          this.logger.error('SourceBuffer error', err)
          this.handleError(err)
        }

        this.sourceBuffer.onupdateend = () => {
          const pos = player.currentTime

          if (player.buffered.length > 0) {
            const lastIndex = player.buffered.length - 1
            // 只获取最后一个缓冲段的 start/end
            const start = player.buffered.start(lastIndex)
            const end = player.buffered.end(lastIndex)

            // 首帧到达：将播放点拉到可播放位置，尽量降低黑屏时间
            if (!this.hasFirstFrame) {
              this.hasFirstFrame = true
              // 使用 targetLatencySeconds（若配置）将播放点定位到接近尾部，但保证不超出缓冲范围
              const desired = Math.max(0, this.targetLatencySeconds || 0)
              const target = desired > 0
                ? Math.max(start, Math.min(end - 0.3, end - desired))
                : start
              player.currentTime = target
              if (player.paused) {
                void player.play().catch(() => { })
              }
            }

            // 处理播放点异常情况
            if (pos < start) {
              player.currentTime = start
            }

            if (pos > end) {
              player.currentTime = start
            }

            // 移除前面的碎片缓冲段
            for (let i = 0; i < player.buffered.length - 1; i++) {
              const preStart = player.buffered.start(i)
              const preEnd = player.buffered.end(i)
              if (!this.sourceBuffer!.updating) {
                this.sourceBuffer!.remove(preStart, preEnd)
              }
            }

            // 控制播放点之前的缓冲（回看）时长，避免历史缓冲无限增长
            if (pos - start > this.backBufferSeconds && !this.sourceBuffer!.updating) {
              const removeEnd = Math.max(0, pos - 3)
              this.sourceBuffer!.remove(0, removeEnd)
            }

            // 控制整体缓冲时长，释放多余内存
            const totalBuffered = end - start
            if (totalBuffered > this.maxBufferSeconds && !this.sourceBuffer!.updating) {
              const overflow = totalBuffered - this.maxBufferSeconds
              const safeRemoveEnd = start + overflow
              this.sourceBuffer!.remove(start, safeRemoveEnd)
            }

            // 统计上报
            if (this.onStats) {
              const liveLatency = end - pos
              this.onStats({
                liveLatency,
                bufferedDuration: totalBuffered,
                queueSize: this.frameQueue.length,
                queueBytes: this.queueBytes,
              })
            }
          }

          this.flushQueue()
        }

        //  创建后立即处理队列中的待处理数据
        this.flushQueue()
      }
      catch (error) {
        this.logger.error('Failed to create SourceBuffer:', error)
        this.isSourceOpen = false
      }
    }

    mediaSource.onsourceclose = () => {
      this.logger.warn('MediaSource 已关闭')
      this.isSourceOpen = false
    }
  }

  destroy() {
    this.cleanupMediaSource()

    this.frameQueue.length = 0
    this.queueBytes = 0
  }
}
