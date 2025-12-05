# xgplayer-ws-fmp4 Monorepo

一个使用 pnpm workspace + Turborepo 管理的多包仓库，核心提供基于 WebSocket + fMP4 的 xgplayer 插件，并包含若干 playground 用于本地调试与演示。

- 核心包：`@wry-smile/xgplayer-ws-fmp4`（可发布到 npm）
- 演示应用：`@wry-smile/playground-single`、`@wry-smile/playground-multi`（private）

仓库地址与反馈

- GitHub：https://github.com/wry-smile/xg-player-ws-mp4
- Issues：https://github.com/wry-smile/xg-player-ws-mp4/issues

---

## 目录结构

```
root
├─ packages/
│  └─ xgplayer-ws-fmp4/                 # 核心库（发布到 npm）
│     ├─ src/
│     ├─ dist/
│     ├─ README.md                      # 英文说明
│     └─ README.zh_cn.md                # 中文说明
│
└─ playground/
   ├─ ws-mp4-playground/                # 单播放器示例（private）
   └─ multiple-player-playground/       # 多播放器示例（private）
```

---

## 快速开始

环境要求

- Node.js 18+
- pnpm（已在 packageManager 指定）

安装依赖

```bash
pnpm install
```

构建核心库

```bash
pnpm -F @wry-smile/xgplayer-ws-fmp4 build
```

启动示例（Playground）

```bash
# 启动单播放器示例
pnpm dev:ws

# 启动多播放器示例
pnpm dev:multi
```

一次性启动所有 dev 任务：

```bash
pnpm dev
```

---

## 核心包

安装

```bash
pnpm add xgplayer @wry-smile/xgplayer-ws-fmp4
# 或
npm i xgplayer @wry-smile/xgplayer-ws-fmp4
```

最小示例

```ts
import Mp4WsPlugin from '@wry-smile/xgplayer-ws-fmp4'
import Player from 'xgplayer'

const player = new Player({
  id: 'video',
  url: 'wss://example.com/live/stream', // 仅支持 ws/wss
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

## 指引

```bash
pnpm install

pnpm dev:ws
# 或
pnpm dev:multiple

pnpm -F @wry-smile/xgplayer-ws-fmp4 build
pnpm type-check
pnpm lint
```

---

## 技术栈与工具

- 构建：unbuild（Rollup + esbuild）
- 包管理：pnpm workspace
- 任务编排：Turborepo
- 应用开发：Vite
- 播放器：xgplayer

---

## 许可

MIT
