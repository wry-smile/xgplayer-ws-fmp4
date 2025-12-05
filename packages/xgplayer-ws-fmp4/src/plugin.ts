import type { IUrl } from 'xgplayer/es/defaultConfig'
import type { Logger } from './logger'
import type { PluginConfig } from './types'
import { BasePlugin, Events, Util } from 'xgplayer'
import { FMp4WsClient } from './client'
import { PLUGIN_NAME, VERSION } from './constant'
import { createLogger } from './logger'
import { extractStringUrl, isMediaStream, isWsUrl } from './utils'

export class Mp4WsPlugin extends BasePlugin {
  private client: FMp4WsClient | null = null

  private pluginLogger: Logger = createLogger({ enabled: false, scope: 'Mp4WsPlugin' })

  static get pluginName() {
    return PLUGIN_NAME
  }

  static get defaultConfig(): PluginConfig {
    return {
      mediaDataSource: { type: 'fmp4' },
      mp4WsConfig: {},
    }
  }

  get version() {
    return VERSION
  }

  beforePlayerInit(): void {
    const { mp4WsConfig } = this.config as PluginConfig

    this.pluginLogger = createLogger({ enabled: mp4WsConfig.debug, scope: 'Mp4WsPlugin' })

    const url = this.playerConfig.url

    this.fmp4Load(url)
  }

  afterCreate(): void {
    const { player } = this

    const video = player.media as HTMLVideoElement

    this.initializeVideoElement(video)

    this.setupUrlChangeListener()

    this.defineUrlGetter()
  }

  private initializeVideoElement(video: HTMLVideoElement): void {
    if (!video)
      return

    video.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
  }

  private setupUrlChangeListener(): void {
    this.on(Events.URL_CHANGE, (url: string) => {
      if (url.startsWith('blob')) {
        return
      }

      this.playerConfig.url = url

      this.fmp4Load(url as unknown as IUrl)
    })
  }

  private defineUrlGetter(): void {
    try {
      BasePlugin.defineGetterOrSetter(this.player, {
        url: {
          get: () => {
            try {
              const video = this.player.media as HTMLVideoElement
              return video?.src ?? null
            }
            catch {
              return null
            }
          },
          configurable: true,
        },
      })
    }
    catch {
      // Noop
    }
  }

  fmp4Load(url?: IUrl) {
    const { mp4WsConfig: defaultConfig } = this.config as PluginConfig
    const { mp4WsConfig: instanceConfig } = this.player.config as PluginConfig
    const mp4WsConfig = Util.deepMerge(defaultConfig || {}, instanceConfig || {})

    if (this.client) {
      this.client?.destroy()
      this.client = null
    }

    if (!url) {
      return
    }

    if (isMediaStream(url)) {
      this.pluginLogger.warn(`${PLUGIN_NAME} only supports ws/wss url, MediaStream is not supported.`)
      return
    }

    const realUrl = extractStringUrl(url)

    if (!realUrl) {
      this.pluginLogger.warn(`invalid url for ${PLUGIN_NAME}, skip ws-mp4 loading.`)
      return
    }

    if (!isWsUrl(realUrl)) {
      this.pluginLogger.warn(`only ws / wss protocol is supported, current url:`, realUrl)
      return
    }

    this.client = new FMp4WsClient({
      player: this.player,
      url: realUrl,
      el: this.player.media as HTMLVideoElement,
      ...mp4WsConfig,
    })
  }

  destroy(): void {
    this.client?.destroy()
    this.client = null

    super.destroy()
  }
}
