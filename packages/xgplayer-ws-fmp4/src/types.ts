import type Player from 'xgplayer/es/player'

export interface PluginConfig {
  mediaDataSource: MediaDataSource
  mp4WsConfig: Mp4WsConfig
}

export interface MediaDataSource {
  type: 'fmp4'
}

export interface Mp4WsConfig {
  /**
   * @description 是否开启调试日志（仅控制 debug/warn，error 不受影响）。
   * @default {false}
   */
  debug?: boolean

  /**
   * @description 期望的直播时延（秒），播放器会尽量跟随这个时延追帧
   * @default {2}
   */
  targetLatencySeconds?: number

  /**
   * @description 最大缓冲时长（秒），超过会自动裁掉更早的片段以节省内存
   * @default {20}
   */
  maxBufferSeconds?: number

  /**
   * @description 播放进度之前保留的缓冲时长（秒），用于拖动/回看
   * @default {10}
   */
  backBufferSeconds?: number

  /**
   * @description 队列中允许缓存的最大帧数（超过会丢弃最旧的帧）
   * @default {50}
   */
  maxQueueSize?: number

  /**
   * @description 队列中允许缓存的最大字节数（超过会丢弃最旧的帧）
   * @default {4 * 1024 * 1024}
   */
  maxQueueBytes?: number

  /**
   * @description WebSocket 最大重连次数（0 表示不重连）。
   * @default {3}
   */
  maxReconnectAttempts?: number

  /**
   * @description WebSocket 首次重连延迟（毫秒），之后按指数退避。
   * @default {1000}
   */
  reconnectDelayMs?: number

  /**
   * @description 重连成功回调（仅在发生过重连后，某次连接成功时触发）
   */
  onReconnectSuccess?: () => void

  /**
   * @description 重连失败回调（达到最大重连次数后触发）
   */
  onReconnectFailed?: (attempts: number) => void

  /**
   * @description 时延与缓冲状态回调
   */
  onStats?: (stats: {
    /**
     * @description 当前实时直播时延（秒），end - currentTime
     */
    liveLatency: number

    /**
     * @description 当前缓冲区总时长（秒），end - start
     */
    bufferedDuration: number

    /**
     * @description 队列中的帧数
     */
    queueSize: number

    /**
     * @description 队列中的总字节数
     */
    queueBytes: number
  }) => void

  /**
   * @description 触发合并追加的最小帧数阈值（默认忽略，沿用当前合并策略）
   */
  mergeThresholdCount?: number

  /**
   * @description 触发合并追加的最小字节阈值（默认忽略，沿用当前合并策略）
   */
  mergeThresholdBytes?: number

  /**
   * @description 覆盖 codecs 字符串（仅当提供时生效）
   */
  codecStringOverride?: string

  /**
   * @description 启用 MediaSource.isTypeSupported 检查（仅影响日志，不改变行为）
   */
  enableTypeSupportCheck?: boolean

  /**
   * @description 媒体合并器发生错误时的回调
   */
  onMergerError?: (error: Error) => void
}

export interface FMp4WsClientOptions extends Mp4WsConfig {
  url: string
  el: HTMLVideoElement | string
  player: Player
}

export type MediaSegmentMergerOptions = Pick<
  Mp4WsConfig,
  | 'debug'
  | 'targetLatencySeconds'
  | 'maxBufferSeconds'
  | 'backBufferSeconds'
  | 'maxQueueSize'
  | 'maxQueueBytes'
  | 'onStats'
  | 'mergeThresholdCount'
  | 'mergeThresholdBytes'
  | 'codecStringOverride'
  | 'enableTypeSupportCheck'
  | 'onMergerError'
> & {

  /**
   * @description SourceBuffer 创建成功后的回调
   */
  onSourceBufferReady?: () => void
}
