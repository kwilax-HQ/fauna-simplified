import faunadb from 'faunadb'

const q = faunadb.query

//////////////////////////////////////////////////////// Types - Start ////////////////////////////////////////////////////////

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

///////////// SCHEMA /////////////
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
///////////// SCHEMA /////////////

//////////////////////////////////////////////////////// Types - End ////////////////////////////////////////////////////////

/**
 *
 *
 *
 *
 *
 *
 *
 *
 */

//////////////////////////////////////////////////////// Utils - Start ////////////////////////////////////////////////////////

const capitalizeFirstLetter = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

const getCollectionName = (collectionName: string): string => {
  // (user) => users
  return collectionName.toLowerCase() + 's'
}
const getIndexName = (indexName: string, collectionName: string): string => {
  // (user, email) => usersByEmail
  return (
    getCollectionName(collectionName) + 'By' + capitalizeFirstLetter(indexName)
  )
}

const asyncWrapper = async (
  asyncFunction: Promise<TObject>
): Promise<[any, any]> => {
  try {
    const response = await asyncFunction
    return [response, null]
  } catch (error) {
    return [null, error]
  }
}

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
const dbConfig = (config: string | TFaunaConfig): IFaunaConfig => {
  if (typeof config === 'string') {
    return {
      ...defaultConfig,
      secret: config,
    }
  } else {
    return { ...defaultConfig, ...config }
  }
}

const sanitizeDocumentInput = (
  document: TObject,
  schema: ISchemaType,
  useDefault = false
): Record<string, unknown> => {
  delete document.id
  delete document.iD
  delete document.Id
  delete document.ID
  const output: Record<string, unknown> = { ...document }

  for (const key in schema) {
    const schemaValue: TSchemaValue = schema[key]
    const userProvidedValue = document.hasOwnProperty(key)
    const hasSchemaDefault =
      typeof schemaValue !== 'string' && schemaValue.default
    // Define schema as string and value is provided

    if (userProvidedValue) {
      const inputValue = document[key] // && typeof document[key] === 'string'
      const isDateType =
        schemaValue === 'date' ||
        (typeof schemaValue !== 'string' && schemaValue.type === 'date')
      if (isDateType && inputValue) {
        const timeValue: any = document[key]
        output[key] = q.Time(timeValue)
      } else {
        output[key] = inputValue
      }
    }

    // User DefaultValue
    if (!userProvidedValue && useDefault && hasSchemaDefault) {
      if (schemaValue.type === 'date' && schemaValue.default) {
        output[key] = q.Time(schemaValue.default)
      } else {
        output[key] = schemaValue.default
      }
    }
  }
  return output
}

const sanitizeDocumentOutput = (
  requestQuery: faunadb.Expr,
  schema: ISchemaType
): faunadb.Expr => {
  const mergeList: faunadb.Expr[] = [q.Select(['data'], q.Var('document'))]
  for (const key in schema) {
    const schemaValue: TSchemaValue = schema[key]
    const isDateType =
      schemaValue === 'date' ||
      (typeof schemaValue !== 'string' && schemaValue.type === 'date')
    if (isDateType) {
      const timeQuery = q.If(
        q.IsNull(q.Select(['data', key], q.Var('document'))),
        {},
        { [key]: q.ToString(q.Select(['data', key], q.Var('document'))) }
      )
      mergeList.push(timeQuery)
    }
  }

  //

  const query = q.Let(
    {
      document: requestQuery,
    },
    q.Merge({ id: q.Select(['ref', 'id'], q.Var('document')) }, mergeList)
  )

  return query
}
const sanitizeListOutput = (
  requestQuery: faunadb.Expr,
  schema: ISchemaType
): faunadb.Expr => {
  const mergeList: faunadb.Expr[] = [q.Select(['data'], q.Var('document'))]
  for (const key in schema) {
    const schemaValue: TSchemaValue = schema[key]
    const isDateType =
      schemaValue === 'date' ||
      (typeof schemaValue !== 'string' && schemaValue.type === 'date')
    if (isDateType) {
      const timeQuery = q.If(
        q.IsNull(q.Select(['data', key], q.Var('document'))),
        {},
        { [key]: q.ToString(q.Select(['data', key], q.Var('document'))) }
      )
      mergeList.push(timeQuery)
    }
  }

  const query = q.Map(
    requestQuery,
    q.Lambda(
      'ref',
      q.Let(
        {
          document: q.Get(q.Var('ref')),
        },
        q.Merge({ id: q.Select(['id'], q.Var('ref')) }, mergeList)
      )
    )
  )

  return query
}

//////////////////////////////////////////////////////// Utils - End ////////////////////////////////////////////////////////

/**
 *
 *
 *
 *
 *
 *
 *
 *
 */

//////////////////////////////////////////////////////// Helpers - Start ////////////////////////////////////////////////////////

const createCollection = async (
  params: ICreateCollection,
  config: TFaunaConfig
): Promise<TObject> => {
  const faunaQuery = new faunadb.Client(dbConfig(config))
  try {
    // create Collection
    const collectionName = getCollectionName(params?.name)
    const collectionExists = await faunaQuery.query(
      q.Exists(q.Collection(collectionName))
    )
    if (collectionExists) return {}
    const response: TObject = await faunaQuery.query(
      q.CreateCollection({
        ...params,
        name: collectionName,
      })
    )
    return response
  } catch (error) {
    return Promise.reject(error)
  }
}

const createCollectionIndex = async (
  params: ICreateCollectionIndex,
  config: TFaunaConfig
): Promise<TObject> => {
  const faunaQuery = new faunadb.Client(dbConfig(config))
  try {
    const collectionName = getCollectionName(params?.sourceCollection)
    const indexName = getIndexName(params?.indexTerm, params.sourceCollection)

    const indexExists = await faunaQuery.query(q.Exists(q.Index(indexName)))
    if (indexExists) return {}
    const response: TObject = await faunaQuery.query(
      q.CreateIndex({
        name: indexName,
        source: q.Collection(collectionName),
        unique: params?.unique ?? false,
        serialized: params?.serialized ?? true,
        terms: [{ field: ['data', params?.indexTerm] }],
      })
    )
    return response
  } catch (error) {
    return Promise.reject(error)
  }
}

interface ICreateDocument {
  payload: TObject
  collectionName: string
  collectionSchema: ISchemaType
  config: TFaunaConfig
  documentId?: TDocumentId
}

const generateListOfCollectionIndexParams = (
  sourceCollection: string,
  collectionSchema: ISchemaType
) => {
  const listOfIndex: ICreateCollectionIndex[] = []

  for (const key in collectionSchema) {
    const schemaValue: TSchemaValue = collectionSchema[key]

    if (typeof schemaValue !== 'string' && schemaValue.index) {
      const newIndex: ICreateCollectionIndex = {
        sourceCollection,
        indexTerm: key,
        unique: false,
        serialized: true,
      }
      listOfIndex.push(newIndex)
    }
  }

  return listOfIndex
}

const createDocument = async ({
  payload,
  collectionName,
  collectionSchema,
  config,
  documentId,
}: ICreateDocument): Promise<TObject> => {
  const faunaQuery = new faunadb.Client(dbConfig(config))
  const rawCollectionName = collectionName
  collectionName = getCollectionName(collectionName)
  const document = sanitizeDocumentInput(payload, collectionSchema, true)
  //prepare create query
  const createCommand = documentId
    ? q.Ref(q.Collection(collectionName), documentId)
    : q.Collection(collectionName)
  const createDocument = { data: document }

  const createDocumentQuery = sanitizeDocumentOutput(
    q.Create(createCommand, createDocument),
    collectionSchema
  )
  // first attempt to create document
  const [docResponse, docError] = await asyncWrapper(
    faunaQuery.query(createDocumentQuery)
  )

  if (docResponse) {
    return Promise.resolve(docResponse)
  }
  /**
   * if error.description says collection as not been created, That is error.description = "Ref refers to undefined collection <collectionName>"
   *    - we should create collection
   *    - we should create all indexes
   *    - we should retry creating document
   * if not reject promise with error
   */
  if (!docError.description.startsWith('Ref refers to undefined collection')) {
    return Promise.reject(docError)
  }
  await createCollection({ name: rawCollectionName }, config).catch((error) =>
    Promise.reject(error)
  )

  const listOfCollectionIndexParams = generateListOfCollectionIndexParams(
    rawCollectionName,
    collectionSchema
  )

  await Promise.all(
    listOfCollectionIndexParams.map((indexParam) =>
      createCollectionIndex(indexParam, config)
    )
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ).catch(() => {})

  return await faunaQuery.query(createDocumentQuery)
}

//////////////////////////////////////////////////////// Helpers - End ////////////////////////////////////////////////////////

/**
 *
 *
 *
 *
 *
 *
 *
 *
 */

export default class FaunaSimplified {
  private faunaClient: faunadb.Client
  protected userConfig: TFaunaConfig
  constructor(config: TFaunaConfig) {
    this.userConfig = config
    this.faunaClient = new faunadb.Client(dbConfig(config))
  }

  private async asyncWrapper(
    asyncFunction: Promise<TObject>
  ): Promise<TObject> {
    return await asyncFunction
  }
  private async asyncWithQuery(asyncFunction: any): Promise<TObject> {
    return await this.asyncWrapper(this.faunaClient.query(asyncFunction))
  }

  async createCollection(config: string | ICreateCollection) {
    const params = typeof config === 'string' ? { name: config } : config
    return await this.asyncWrapper(createCollection(params, this.userConfig))
  }
  async createCollectionIndex(params: ICreateCollectionIndex) {
    return await this.asyncWrapper(
      createCollectionIndex(params, this.userConfig)
    )
  }

  model(collectionName: string, collectionSchema: ISchemaType) {
    const rawCollectionName = collectionName
    collectionName = getCollectionName(collectionName)

    const Create = async (payload: TObject, documentId?: TDocumentId) => {
      return await this.asyncWrapper(
        createDocument({
          payload,
          collectionName: rawCollectionName,
          documentId,
          collectionSchema,
          config: this.userConfig,
        })
      )
    }
    const Exists = async (documentId?: TDocumentId) => {
      const query = q.Exists(q.Ref(q.Collection(collectionName), documentId))
      return await this.asyncWithQuery(query)
    }
    const Find = async (documentId?: TDocumentId) => {
      const query = q.Get(q.Ref(q.Collection(collectionName), documentId))
      return await this.asyncWithQuery(
        sanitizeDocumentOutput(query, collectionSchema)
      )
    }
    const FindByIndex = async (collectionIndex: string, searchTerm: string) => {
      const indexName = getIndexName(collectionIndex, rawCollectionName)
      const query = q.Get(q.Match(q.Index(indexName), searchTerm))
      return await this.asyncWithQuery(
        sanitizeDocumentOutput(query, collectionSchema)
      )
    }
    const FindAll = async () => {
      const query = q.Paginate(q.Documents(q.Collection(collectionName)))
      return await this.asyncWithQuery(
        sanitizeListOutput(query, collectionSchema)
      )
    }
    const Update = async (documentId: TDocumentId, payload: TObject) => {
      const document = sanitizeDocumentInput(payload, collectionSchema)
      const query = q.Update(q.Ref(q.Collection(collectionName), documentId), {
        data: document,
      })
      return await this.asyncWithQuery(
        sanitizeDocumentOutput(query, collectionSchema)
      )
    }
    const Upsert = async (documentId: TDocumentId, payload: TObject) => {
      const documentForUpdating = sanitizeDocumentInput(
        payload,
        collectionSchema
      )
      const documentForCreating = sanitizeDocumentInput(
        payload,
        collectionSchema,
        true
      )
      const query = q.If(
        q.Exists(q.Ref(q.Collection(collectionName), documentId)),
        q.Update(q.Ref(q.Collection(collectionName), documentId), {
          data: documentForUpdating,
        }),
        q.Create(q.Ref(q.Collection(collectionName), documentId), {
          data: documentForCreating,
        })
      )
      return await this.asyncWithQuery(
        sanitizeDocumentOutput(query, collectionSchema)
      )
    }
    const Replace = async (documentId: TDocumentId, payload: TObject) => {
      const document = sanitizeDocumentInput(payload, collectionSchema)
      const query = q.Replace(q.Ref(q.Collection(collectionName), documentId), {
        data: document,
      })
      return await this.asyncWithQuery(
        sanitizeDocumentOutput(query, collectionSchema)
      )
    }
    const Delete = async (documentId?: TDocumentId) => {
      const query = q.Delete(q.Ref(q.Collection(collectionName), documentId))
      return await this.asyncWithQuery(
        sanitizeDocumentOutput(query, collectionSchema)
      )
    }

    return {
      Create,
      Exists,
      Find,
      FindByIndex,
      FindAll,
      Update,
      Upsert,
      Replace,
      Delete,
    }
  }
}
