import { name, version } from '../package.json'

export const PLUGIN_NAME = name

export const LOG_PREFIX = `[${PLUGIN_NAME}]`

export const VERSION = version

export const MAX_QUEUE_BYTES = 4 * 1024 * 1024

export const MAX_QUEUE_SIZE = 50

export const BACK_BUFFER_SECONDS = 10

export const MAX_BUFFER_SECONDS = 20

export const TARGET_LATENCY_SECONDS = 2
