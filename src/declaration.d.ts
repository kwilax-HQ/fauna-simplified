import faunadb from 'faunadb'

type hello = faunadb.RequestResult
interface IFaunaConfig {
  secret: string
  domain?: string
  scheme?: 'https' | 'http'
  port?: number
  timeout?: number
  //   observer?: <T extends Record<string, unknown> = Record<string, unknown>>(
  //     res: faunadb.RequestResult<T | faunadb.errors.FaunaHTTPError>,
  //     client: faunadb.Client
  //   ) => void
  keepAlive?: boolean
  headers?: { [key: string]: string | number }
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  queryTimeout?: number
  http2SessionIdleTime?: number
  checkNewVersion?: boolean
}
type TFaunaConfig = string | IFaunaConfig

type TObject = Record<string, unknown>

type TDocumentId = number | `${number}`

interface ICreateCollection {
  name: string // Cannot be events, sets, self, documents, or _. Cannot have the % character.
  data?: Record<string, unknown>
  history_days?: number // 0
  ttl_days?: number // null
  permissions?: Record<string, unknown>
}

interface ICreateCollectionIndex {
  // name: string; // Cannot be events, sets, self, documents, or _. Cannot have the % character.
  sourceCollection: string
  indexTerm: string // terms field to be indexed. this would be added in the terms field in faunaDB
  // values (would not use)
  unique?: boolean
  serialized?: boolean
  data?: Record<string, unknown>
  permissions?: Record<string, unknown>
}

////////////////////////////////////////////////// SCHEMA //////////////////////////////////////////////////

type schemaKnownType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
type schemaKnownIndexType =
  | { index?: true; unique?: boolean }
  | { index?: false; unique?: never }

type schemaBooleanType = { type: 'boolean'; index?: boolean; default?: boolean }
type schemaDateType = { type: 'date'; index?: boolean; default?: string }

type schemaCommonType = {
  type: 'string' | 'number' | 'object' | 'array'
  default?: unknown
} & schemaKnownIndexType

type TSchemaValue =
  | schemaKnownType
  | schemaCommonType
  | schemaBooleanType
  | schemaDateType
interface ISchemaType {
  [key: string]: TSchemaValue
}

////////////////////////////////////////////////// SCHEMA //////////////////////////////////////////////////
