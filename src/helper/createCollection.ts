import faunadb from 'faunadb'
import { getCollectionName, dbConfig } from '../utils'
import { ICreateCollection, TFaunaConfig, TObject } from '../declaration'

const q = faunadb.query

export const createCollection = async (
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
