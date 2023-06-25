import faunadb from 'faunadb'
import { TObject, ISchemaType, TSchemaValue } from '../declaration'

const q = faunadb.query

export const sanitizeDocumentInput = (
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
