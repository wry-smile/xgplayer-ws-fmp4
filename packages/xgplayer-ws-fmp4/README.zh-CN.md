# @wry-smile/xgplayer-ws-fmp4

一个基于 WebSocket + fMP4 的 **xgplayer 插件**。

> 仅支持 `ws://`、`wss://` 协议的 URL。

---

## 安装

使用 pnpm（推荐）：

```bash
pnpm add xgplayer @wry-smile/xgplayer-ws-fmp4
```

或使用 npm：

```bash
npm install xgplayer @wry-smile/xgplayer-ws-fmp4
```

---

## 快速上手

```ts
import Mp4WsPlugin from '@wry-smile/xgplayer-ws-fmp4'
import Player from 'xgplayer'

const player = new Player({
  id: 'video',
  url: 'wss://example.com/live/stream', // 仅支持 ws / wss
  isLive: true,
  plugins: [Mp4WsPlugin],
  mp4WsConfig: {
    targetLatencySeconds: 2,
    maxBufferSeconds: 20,
    backBufferSeconds: 10,
  },
})
```

---

## 配置说明

### `Mp4WsConfig`

```ts
export interface Mp4WsConfig {
  targetLatencySeconds?: number
  maxBufferSeconds?: number
  backBufferSeconds?: number
  maxQueueSize?: number
  maxQueueBytes?: number
  maxReconnectAttempts?: number
  reconnectDelayMs?: number
  onReconnectSuccess?: () => void
  onReconnectFailed?: (attempts: number) => void
  onStats?: (stats: {
    liveLatency: number
    bufferedDuration: number
    queueSize: number
    queueBytes: number
  }) => void
}
```

- **targetLatencySeconds**: 期望直播时延（秒），播放器会尽量把播放点控制在 “最新缓冲 - 该时长” 附近，默认 `2`。
- **maxBufferSeconds**: 整体缓冲上限（秒），超过会自动裁掉更早的片段以节省内存，默认 `20`。
- **backBufferSeconds**: 播放点之前最多保留的缓冲时长（秒），用于简单回看，默认 `10`。
- **maxQueueSize**: WebSocket 收到但尚未 append 完成的帧队列最大长度，超过会丢弃最旧的帧，默认 `50`。
- **maxQueueBytes**: 帧队列的最大总字节数，超过会丢弃最旧的帧，默认 `4 * 1024 * 1024`。
- **maxReconnectAttempts**: WebSocket 最大重连次数（0 表示不重连），默认 `3`。
- **reconnectDelayMs**: 首次重连延迟（毫秒），后续使用指数退避（1x、2x、4x ...），默认 `1000`。
- **onReconnectSuccess**: 重连成功回调（仅在发生过重连后、某次 `open` 事件触发时回调一次）。
- **onReconnectFailed**: 重连失败回调（达到最大重连次数后触发，参数为尝试次数）。
- **onStats**: 时延 & 缓冲状态上报回调：
  - `liveLatency`: 当前直播时延（秒），`bufferedEnd - currentTime`。
  - `bufferedDuration`: 当前缓冲区总时长（秒），`bufferedEnd - bufferedStart`。
  - `queueSize`: 帧队列长度。
  - `queueBytes`: 帧队列总字节数。

---

## 内部行为（简要说明）

- 使用 `MediaSource + SourceBuffer` 播放 fMP4 直播流。
- 首段数据到达并解析完 `moov` 后，立即创建 `MediaSource` 并绑定到 `<video>`。
- 追加数据时：
  - 基于 `targetLatencySeconds` 做直播追帧，防止累计时延。
  - 基于 `maxBufferSeconds` 和 `backBufferSeconds` 做缓冲裁剪，控制内存占用。
  - 基于 `maxQueueSize` 和 `maxQueueBytes` 控制帧队列长度与字节数，防止堆积。

---

## License

MIT
