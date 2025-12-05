import { Mp4WsPlugin } from '@wry-smile/xgplayer-ws-fmp4'
import Player from 'xgplayer'
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

const player = new Player({
  id: 'mse',
  autoplay: true,
  url: playerUrls.map(item => ({ src: item })),
  playsinline: true,
  height: window.innerHeight,
  width: window.innerWidth,
  plugins: [Mp4WsPlugin],
})

// eslint-disable-next-line no-console
console.log(player)

// const videoElement = document.getElementById('mse') as HTMLVideoElement

// console.log(videoElement)
// const player = new FMp4WsClient({
//   url,
//   el: videoElement,
// })

// console.log(player)
