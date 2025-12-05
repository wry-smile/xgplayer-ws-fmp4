import { LOG_PREFIX } from './constant'

export interface Logger {
  debug: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

export function createLogger(options?: { enabled?: boolean, scope?: string }): Logger {
  const enabled = !!options?.enabled
  const scope = options?.scope ? `[${options.scope}]` : ''

  return {
    debug: (...args: any[]) => {
      if (!enabled)
        return
      // eslint-disable-next-line no-console
      console.debug(LOG_PREFIX, scope, ...args)
    },
    warn: (...args: any[]) => {
      if (!enabled)
        return

      console.warn(LOG_PREFIX, scope, ...args)
    },
    error: (...args: any[]) => {
      console.error(LOG_PREFIX, scope, ...args)
    },
  }
}
