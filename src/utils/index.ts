import faunadb from 'faunadb'
import { TObject } from '../declaration'

export { sanitizeDocumentInput } from './sanitizeDocumentInput'
export {
  sanitizeDocumentOutput,
  sanitizeListOutput,
} from './sanitizeDocumentOutput'
export { dbConfig } from './dbConfig'

function capitalizeFirstLetter(word: string) {
  const loserCasedWord = word.toLowerCase()
  return loserCasedWord.charAt(0).toUpperCase() + loserCasedWord.slice(1)
}

export function getCollectionName(collectionName: string): string {
  // (user) => users
  return collectionName.toLowerCase() + 's'
}
export function getIndexName(
  indexName: string,
  collectionName: string
): string {
  // (user, email) => usersByEmail
  return (
    getCollectionName(collectionName) + 'By' + capitalizeFirstLetter(indexName)
  )
}

export const asyncWrapper = async (
  asyncFunction: Promise<TObject>
): Promise<[any, any]> => {
  try {
    const response = await asyncFunction
    return [response, null]
  } catch (error) {
    return [null, error]
  }
}
