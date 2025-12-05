import type { IError } from 'xgplayer'
import { Mp4WsPlugin } from '@wry-smile/xgplayer-ws-fmp4'
import Player, { Events } from 'xgplayer'
import 'xgplayer/dist/index.min.css'

const playerUrls: string[] = [
  'ws://192.168.1.47:28080/rtp/34020000001320000014_34020000001310000001.live.mp4',
  'ws://192.168.1.47:28080/rtp/34020000001310000047_34020000001370000047.live.mp4',
  'ws://192.168.1.47:28080/rtp/34020000001310000047_34020000001320000047.live.mp4',
  'ws://192.168.1.47:28080/rtp/34020000001310000047_34020000001310000047.live.mp4',
  'ws://192.168.1.47:28080/rtp/34020000001320000066_34020000001370000003.live.mp4',
  'ws://192.168.1.47:28080/rtp/34020000001320000066_34020000001320000003.live.mp4',
  'ws://localhost:8081',
]

async function layoutContainer() {
  const container = document.getElementById('container')
  if (!container)
    return
  const sqrt = Math.ceil(Math.sqrt(playerUrls.length))

  container.style.display = 'grid'
  container.style.gridTemplateColumns = `repeat(${sqrt}, minmax(0, 1fr))`
  container.style.gridTemplateRows = `repeat(${sqrt}, minmax(0, 1fr))`
  container.style.gap = '16px'

  const layout = sqrt * sqrt

  for (let i = 0; i <= layout; i++) {
    const videoContainer = document.createElement('div')
    container.append(videoContainer)

    const url = playerUrls[i]

    if (!url)
      continue

    createPlayer(videoContainer, url)
  }
}

function createPlayer(el: HTMLElement, url: string) {
  const player = new Player({
    el,
    autoplay: true,
    autoplayMuted: true,
    url,
    isLive: true,
    playsinline: true,
    height: '100%',
    width: '100%',
    plugins: [Mp4WsPlugin],
    mp4WsConfig: {
      debug: true,
    },
  })

  player.on(Events.ERROR, (error: IError) => {
    // eslint-disable-next-line no-console
    console.log(error)
  })
}

layoutContainer()
