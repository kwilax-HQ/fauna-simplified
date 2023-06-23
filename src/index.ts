import faunadb from 'faunadb'
import {
  createCollection,
  createCollectionIndex,
  createDocument,
} from './helper'
import {
  getCollectionName,
  getIndexName,
  dbConfig,
  sanitizeDocumentInput,
  sanitizeDocumentOutput,
  sanitizeListOutput,
} from './utils'
import {
  TFaunaConfig,
  ICreateCollection,
  ICreateCollectionIndex,
  ISchemaType,
  TObject,
  TDocumentId,
} from './declaration'

const q = faunadb.query

export class FaunaSimplified {
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

  async createCollection(params: ICreateCollection) {
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
