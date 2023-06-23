import { IFaunaConfig, TFaunaConfig } from '../declaration'

const defaultConfig: TFaunaConfig = {
  secret: '',
  domain: 'db.fauna.com',
  scheme: 'https',
  // port: null,
  timeout: 60,
  keepAlive: true,
  headers: {},
  fetch: undefined,
  // queryTimeout: null,
  // http2SessionIdleTime: null,
  checkNewVersion: false,
}
export const dbConfig = (config: string | TFaunaConfig): IFaunaConfig => {
  if (typeof config === 'string') {
    return {
      ...defaultConfig,
      secret: config,
    }
  } else {
    return { ...defaultConfig, ...config }
  }
}
