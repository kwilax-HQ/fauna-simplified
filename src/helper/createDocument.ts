import faunadb from 'faunadb'
import { createCollection } from './createCollection'
import { createCollectionIndex } from './createCollectionIndex'
import {
  getCollectionName,
  asyncWrapper,
  dbConfig,
  sanitizeDocumentInput,
  sanitizeDocumentOutput,
} from '../utils'
import {
  ICreateCollectionIndex,
  ISchemaType,
  TDocumentId,
  TFaunaConfig,
  TObject,
  TSchemaValue,
} from '../declaration'

const q = faunadb.query

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

export const createDocument = async ({
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
