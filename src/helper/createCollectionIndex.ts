import faunadb from 'faunadb'
import { getCollectionName, getIndexName, dbConfig } from '../utils'
import { ICreateCollectionIndex, TFaunaConfig, TObject } from '../declaration'

const q = faunadb.query

export const createCollectionIndex = async (
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
