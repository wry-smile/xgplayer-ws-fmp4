# xgplayer-ws-fmp4 Monorepo

A multi-package repository managed with pnpm workspace + Turborepo, providing a core xgplayer plugin based on WebSocket + fMP4, along with several playgrounds for local debugging and demonstration.

- Core Package: `@wry-smile/xgplayer-ws-fmp4` (publishable to npm)
- Demo Applications: `@wry-smile/playground-single`, `@wry-smile/playground-multi` (private)

Repository & Feedback

- GitHub: https://github.com/wry-smile/xg-player-ws-mp4
- Issues: https://github.com/wry-smile/xg-player-ws-mp4/issues

---

## Directory Structure

```
root
├─ packages/
│  └─ xgplayer-ws-fmp4/                 # Core library (published to npm)
│     ├─ src/
│     ├─ dist/
│     ├─ README.md                      # English documentation
│     └─ README.zh_cn.md                # Chinese documentation
│
└─ playground/
   ├─ ws-mp4-playground/                # Single player example (private)
   └─ multiple-player-playground/       # Multiple player example (private)
```

---

## Quick Start

Requirements

- Node.js 18+
- pnpm (specified in packageManager)

Install Dependencies

```bash
pnpm install
```

Build Core Library

```bash
pnpm -F @wry-smile/xgplayer-ws-fmp4 build
```

Start Examples (Playground)

```bash
# Start single player example
pnpm dev:ws

# Start multiple player example
pnpm dev:multi
```

Start all dev tasks at once:

```bash
pnpm dev
```

---

## Core Package

Installation

```bash
pnpm add xgplayer @wry-smile/xgplayer-ws-fmp4
# or
npm i xgplayer @wry-smile/xgplayer-ws-fmp4
```

Minimal Example

```ts
import Mp4WsPlugin from '@wry-smile/xgplayer-ws-fmp4'
import Player from 'xgplayer'

const player = new Player({
  id: 'video',
  url: 'wss://example.com/live/stream', // Only supports ws/wss
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

## Commands

```bash
pnpm install

pnpm dev:ws
# or
pnpm dev:multiple

pnpm -F @wry-smile/xgplayer-ws-fmp4 build
pnpm type-check
pnpm lint
```

---

## Tech Stack & Tools

- Build: unbuild (Rollup + esbuild)
- Package Management: pnpm workspace
- Task Orchestration: Turborepo
- Application Development: Vite
- Player: xgplayer

---

## License

MIT
