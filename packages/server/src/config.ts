import { CorsOptions } from 'apollo-server-express'
import { IntrospectionNotPermitted, MissingConfig, TracingRequired } from './errors'

export type Config = {
  allowIntrospection?: boolean
  allowedOrigins: CorsOptions['origin']
  apiPort: number
  cacheEnabled: boolean
  hasuraUri: string
  cardanoNodeSocketPath: string
  prometheusMetrics: boolean
  queryDepthLimit: number
  tracing: boolean
  whitelistPath: string
}

export async function getConfig (): Promise<Config> {
  const {
    allowIntrospection,
    allowedOrigins,
    apiPort,
    cacheEnabled,
    hasuraUri,
    cardanoNodeSocketPath,
    prometheusMetrics,
    queryDepthLimit,
    tracing,
    whitelistPath
  } = filterAndTypecastEnvs(process.env)
  if (!hasuraUri) {
    throw new MissingConfig('HASURA_URI env not set')
  }
  if (!cardanoNodeSocketPath) {
    throw new MissingConfig('CARDANO_NODE_SOCKET_PATH env not set')
  }
  if (prometheusMetrics && process.env.TRACING === 'false') {
    throw new TracingRequired('Prometheus')
  }
  if (whitelistPath && allowIntrospection) {
    throw new IntrospectionNotPermitted('whitelist')
  }
  return {
    allowIntrospection,
    allowedOrigins: allowedOrigins || true,
    apiPort: apiPort || 3100,
    cardanoNodeSocketPath,
    cacheEnabled: cacheEnabled || false,
    hasuraUri,
    prometheusMetrics,
    queryDepthLimit: queryDepthLimit || 10,
    tracing,
    whitelistPath
  }
}

function filterAndTypecastEnvs (env: any) {
  const {
    ALLOW_INTROSPECTION,
    ALLOWED_ORIGINS,
    API_PORT,
    CACHE_ENABLED,
    HASURA_URI,
    CARDANO_NODE_SOCKET_PATH,
    PROMETHEUS_METRICS,
    QUERY_DEPTH_LIMIT,
    TRACING,
    WHITELIST_PATH
  } = env
  return {
    allowIntrospection: ALLOW_INTROSPECTION === 'true' ? true : undefined,
    allowedOrigins: ALLOWED_ORIGINS,
    apiPort: Number(API_PORT),
    cacheEnabled: CACHE_ENABLED === 'true' ? true : undefined,
    hasuraUri: HASURA_URI,
    cardanoNodeSocketPath: CARDANO_NODE_SOCKET_PATH,
    prometheusMetrics: PROMETHEUS_METRICS === 'true' ? true : undefined,
    queryDepthLimit: Number(QUERY_DEPTH_LIMIT),
    tracing: TRACING === 'true' ? true : undefined,
    whitelistPath: WHITELIST_PATH
  }
}
