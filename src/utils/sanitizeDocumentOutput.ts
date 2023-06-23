import faunadb from 'faunadb'
import { ISchemaType, TSchemaValue } from '../declaration'

const q = faunadb.query

export const sanitizeDocumentOutput = (
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

  const query = q.Let(
    {
      document: requestQuery,
    },
    q.Merge({ id: q.Select(['ref', 'id'], q.Var('document')) }, mergeList)
  )

  return query
}
export const sanitizeListOutput = (
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
