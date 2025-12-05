# @wry-smile/xgplayer-ws-fmp4

An xgplayer plugin for WebSocket fMP4 live streaming.

> Only `ws://` and `wss://` URLs are supported.

---

## Installation

Using pnpm (recommended):

```bash
pnpm add xgplayer @wry-smile/xgplayer-ws-fmp4
```

Using npm:

```bash
npm install xgplayer @wry-smile/xgplayer-ws-fmp4
```

---

## Quick Start

```ts
import Mp4WsPlugin from '@wry-smile/xgplayer-ws-fmp4'
import Player from 'xgplayer'

const player = new Player({
  id: 'video',
  url: 'wss://example.com/live/stream', // ws / wss only
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

## Configuration

### `Mp4WsConfig`

Type definition overview:

```ts
export interface Mp4WsConfig {
  debug?: boolean
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
    liveLatency: number // bufferedEnd - currentTime
    bufferedDuration: number // bufferedEnd - bufferedStart
    queueSize: number
    queueBytes: number
  }) => void

  mergeThresholdCount?: number
  mergeThresholdBytes?: number
  codecStringOverride?: string
  enableTypeSupportCheck?: boolean
  onMergerError?: (error: Error) => void
}
```

Key options:

- `targetLatencySeconds`: Desired live latency (seconds). The player tries to keep playback near `bufferedEnd - targetLatencySeconds`. Default: `2`.
- `maxBufferSeconds`: Max buffered duration (seconds). Older segments are trimmed to save memory. Default: `20`.
- `backBufferSeconds`: Max buffered duration kept before currentTime (seconds). Default: `10`.
- `maxQueueSize`: Max number of frames waiting to be appended. Drop the oldest when exceeded. Default: `50`.
- `maxQueueBytes`: Max total bytes in the waiting queue. Drop the oldest when exceeded. Default: `4 * 1024 * 1024`.
- `maxReconnectAttempts`: Max WebSocket reconnect attempts (`0` = no reconnect). Default: `3`.
- `reconnectDelayMs`: Initial reconnect delay in ms. Subsequent attempts use exponential backoff (1x, 2x, 4x ...). Default: `1000`.
- `onReconnectSuccess`: Called once when a reconnect eventually succeeds.
- `onReconnectFailed`: Called when max attempts are exhausted.
- `onStats`: Periodic stats callback.
- `mergeThresholdCount`/`mergeThresholdBytes`: Optional thresholds to trigger batch appends.
- `codecStringOverride`: Override the `codecs` string (if provided).
- `enableTypeSupportCheck`: Check `MediaSource.isTypeSupported`; affects logging only.
- `onMergerError`: Called when the media segment merger encounters an error.

---

## How it works (brief)

- Uses `MediaSource + SourceBuffer` to play a live fMP4 stream.
- Once the first initialization segment (moov) is parsed, it creates `MediaSource` and attaches it to the `<video>` element.
- While appending:
  - Keeps live playback close to the target latency (chasing strategy).
  - Trims buffer by `maxBufferSeconds` and `backBufferSeconds` to control memory.
  - Applies queue backpressure via `maxQueueSize` and `maxQueueBytes` to avoid buildup.

---

## License

MIT
