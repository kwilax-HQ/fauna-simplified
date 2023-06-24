
# @kwilax/fauna-simplified

@kwilax/fauna-simplified is a JavaScript library that simplifies the usage of  [FaunaDB](https://fauna.com/) a flexible serverless database. It provides an intuitive and streamlined interface for interacting with FaunaDB, making it easier to perform common database operations and work with data models.

## Features
- Simplified API: The library offers a simplified API that abstracts away the complexity of FaunaDB's native API, allowing you to focus on your application logic rather than low-level database interactions.
- Easy Setup: The library provides a straightforward setup process, requiring minimal configuration to connect to your FaunaDB instance.
- Model-centric Approach: It embraces a model-centric approach, making it easy to define and work with data models by providing convenient abstractions for creating, reading, updating, and deleting data.
- Automatic Pagination: Pagination of query results is handled automatically, simplifying the retrieval of large data sets.
- Error Handling: The library returns the FaunaDB error for better insight into, however **error.description** is sufficient for most use case.


## Installation
```
npm i @kwilax/fauna-simplified
```

## usage
Here's a basic example of how to use @kwilax/fauna-simplified to perform common database operations:
```
// Using ES6 import
import FaunaSimplified from '@kwilax/fauna-simplified';

// Using commonjs require
const FaunaSimplified = require('@kwilax/fauna-simplified');

const faunaInstance = new FaunaSimplified(Your_FaunaDB_Key)

const ProductModel = faunaInstance.model('product', {
      name: 'string',
      description: 'string',
      store: {
        type: 'string',
        default: 'New Shoes Venture',
        index: true,
      },
      category: {
        type: 'string',
        default: 'general',
        index: true,
      },
      createdAt: {
        type: 'date',
        default: new Date().toISOString(),
      },
})

const CreateProduct = async () => {
    try {
        const response = await Product.Create({
            name: 'Airforce One',
            category: 'Snickers',
        })
      console.log('response', response)
      // response {
      //   name: 'Airforce One Max',
      //   store: 'New Shoes Venture',
      //   id: '368313122636693584',
      //   createdAt: '2023-06-23T08:40:10.217Z',
      //   category: 'Snickers'
      // }
    } catch (error) {
      console.log('error', error.description)
    }
}
```

## Configuration
The FaunaSimplified class can either be configured with
- secretKey
```
const faunaInstance = new FaunaSimplified(Your_FaunaDB_Key)
```
- Config object
```
const faunaInstance = new FaunaSimplified({
    secret: '',
    domain: 'db.fauna.com',
    scheme: 'https',
})
```
## Configuration Options

The configuration object passed to the `FaunaClient` constructor can include the following properties:

| Property              | Type                                                                           | Default Value        | Description                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| secret                | string                                                                         | ''                   | The FaunaDB secret key used for authentication.                                                                              |
| domain (optional)     | string                                                                         | 'db.fauna.com'       | The domain of the FaunaDB server.                                                                                             |
| scheme (optional)     | 'https' \| 'http'                                                               | 'https'              | The protocol scheme to use for the FaunaDB connection.                                                                        |
| port (optional)       | number                                                                         |                      | The port number to use for the FaunaDB connection. If not provided, the default port for the chosen scheme will be used.     |
| timeout (optional)    | number                                                                         | 60                   | The timeout value in seconds for the FaunaDB requests.                                                                        |
| observer (optional)   | (res: faunadb.RequestResult<T \| faunadb.errors.FaunaHTTPError>, client: faunadb.Client) => void |                      | A callback function that gets called with the request result and client for each request made to FaunaDB.                  |
| keepAlive (optional)  | boolean                                                                        | true                 | Determines if the connection to FaunaDB should be kept alive.                                                                 |
| headers (optional)    | { [key: string]: string \| number }                                              | {}                   | Additional headers to be included in the requests to FaunaDB.                                                                 |
| fetch (optional)      | (input: RequestInfo \| URL, init?: RequestInit) => Promise<Response>             |                      | A custom `fetch` function to be used for making HTTP requests.                                                                 |
| queryTimeout (optional) | number                                                                        |                      | The query timeout value in milliseconds for FaunaDB queries.                                                                   |
| http2SessionIdleTime (optional) | number                                                                        |                      | The idle time in milliseconds after which the HTTP/2 session will be closed.                                                   |
| checkNewVersion (optional) | boolean                                                                      | false                | Determines if the library should check for a new version when initiating a FaunaDB client.                                   |


## Model
model is the primary method on the faunaInstance. it takes collection name and schema of your data. Not that this schema can be changed at any time. However, if you add a new value that should be indexed, you would need to call the **createCollectionIndex** method

### Model schema
- The Schema can either be a string with the type as value
  ```
  category: 'string'
  ```
- or an object
  ```
  category:{
    type: 'string',
    default: 'general',
    index: true,
    unique: true,
  }
  ```
- SchemaType
  - 'string'
  - 'number'
  - 'boolean'
  - 'date'
  - 'object'
  - 'array'
- **default**: value to save if no value is provided when creating a document
- **index**: creates an index for the value when initializing the model. [learn more about fauna index](https://docs.fauna.com/fauna/current/api/fql/indexes?lang=shell)
- **unique**: flag the index as unique i.e every entry must be unique. Not applicable to boolean and date
- **date type:** using the date type for any date/time input tells this library to convert it to fauna dateType during input and back to ISO string at output. The expected and returned type is ISO string.
- **id:** the "id" field is resevered for the [fauna document reference (Ref)](https://docs.fauna.com/fauna/current/learn/understanding/types?lang=shell#ref). This means any "id", "iD", "Id", "ID" provided in you document would not saved however you can provide you id when creating a document.

### Model object
```
import FaunaSimplified from '@kwilax/fauna-simplified';

const faunaInstance = new FaunaSimplified(Your_FaunaDB_Key)
// product is the collection name
// {...} is the schema
const ProductModel = faunaInstance.model('product', {
      name: 'string',
      description: 'string',
      store: {
        type: 'string',
        default: 'New Shoes Venture',
        index: true,
      },
      category: {
        type: 'string',
        default: 'general',
        index: true,
      },
      createdAt: {
        type: 'date',
        default: new Date().toISOString(),
      },
})
```

### Model Methods
  - **Create**: it creates a document in the Models collection. If run for the first time, it create the collection and indexes bases on the schema. For naming convention, refer **"CreateCollection"** & **"CreateCollectionIndex"**
    ```
    const userData = {
        name: 'Airforce One',
        category: 'Snickers',
    }
    const response = await Product.Create(userData)
    {
        name: 'Airforce One',
        store: 'New Shoes Venture',
        id: '368313122636693584',
        createdAt: '2023-06-23T08:40:10.217Z',
        category: 'Snickers'
    }
    // with user defined id 
    const customId = "123"
    const response = await Product.Create(userData, customId)
    {
        name: 'Airforce One',
        store: 'New Shoes Venture',
        id: '123',
        createdAt: '2023-06-23T08:40:10.217Z',
        category: 'Snickers'
    }
    ```
    - Note that the id most be a number i.e 123 or a number string i.e "123" and you are responsible for ensuring that it is unique,
    - this id is your [fauna document reference (Ref)](https://docs.fauna.com/fauna/current/learn/understanding/types?lang=shell#ref)

  - Exists: returns true if a document exist else false
    ```
    const productId = "368313122636693584"
    const response = await Product.Exists(productId)
    ```

  - Find
    ```
    const productId = "368313122636693584"
    const response = await Product.Find(productId)
    ```

  - FindByIndex
    ```
    const indexTerm = "category"
    const valueToFind = "Snickers"
    const response = await Product.FindByIndex(indexTerm, valueToFind)
    ```

  - FindAll
    ```
    const response = await Product.FindAll()
    [
        {
        name: 'Airforce One',
        store: 'New Shoes Venture',
        id: '368313122636693584',
        createdAt: '2023-06-23T08:40:10.217Z',
        category: 'Snickers'
        },
        {
        name: 'air max 90',
        store: 'New Shoes Venture',
        id: '368313122636693768',
        createdAt: '2023-06-23T08:40:10.217Z',
        category: 'Snickers'
        }
    ]
    ```

  - Update
    ```
    const productId = "368313122636693584"
    const newData = {
        name: 'air max 1',
    }
    const response = await Product.Update(productId, newData)
    ```

  - Upsert: Unlike **Update** if document does not exist, **Upsert** creates the product and not return error

  - Replace
    ```
    const productId = "368313122636693584"
    const newData = {
        name: 'air max 1',
    }
    const response = await Product.Replace(productId, newData)
    ```

  - Delete
    ```
    const productId = "368313122636693584"
    const response = await Product.Delete(productId)
    ```

## CreateCollection
The [fauna collection](https://docs.fauna.com/fauna/current/learn/introduction/key_concepts#collections) is the SQL equivalent of a table. You may not need to call this method as the **model.create** method create a collection and indexes based on the schema on saving the first time/
```
import FaunaSimplified from '@kwilax/fauna-simplified';

const faunaInstance = new FaunaSimplified(Your_FaunaDB_Key)

const response = await faunaInstance.createCollection({name: "product"})
//  {
//    ref: Collection("products"),
//    ts: 1687508761360000,
//    history_days: 0,
//    name: 'products'
//  }
```
[CreateCollection params](https://docs.fauna.com/fauna/current/api/fql/functions/createcollection?lang=javascript#param_object)
| Property             | Type                         | Description                                                   |
| -------------------- | ---------------------------- | ------------------------------------------------------------- |
| name                 | string                       | The name of the collection to be created.                     |
| data (optional)      | object      | Additional data associated with the collection.                |
| history_days (optional)        | number (optional)            | The number of days to retain historical data for the collection.|
| ttl_days (optional)            | number (optional)            | The number of days after which documents in the collection will expire.|
| permissions (optional)| object      | Permissions associated with the collection.                    |


## CreateCollectionIndex
[learm more about fauna index](https://docs.fauna.com/fauna/current/api/fql/indexes?lang=shell)
```
import FaunaSimplified from '@kwilax/fauna-simplified';

const faunaInstance = new FaunaSimplified(Your_FaunaDB_Key)
const response = await faunaInstance.createCollection({
    sourceCollection: "product",
    indexTerm: "category"
})

// {
  //   ref: Index("productsByCategory"),
  //   ts: 1687509515330000,
  //   active: true,
  //   serialized: true,
  //   name: 'productsByCategory',
  //   source: Collection("product"),
  //   unique: false,
  //   terms: [ { field: [Array] } ],
  //   partitions: 1
  // }
```
[Indexes](https://docs.fauna.com/fauna/current/api/fql/indexes?lang=shell)

| Property          | Type                         | Description                                                                                            |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| sourceCollection    | string                       | The name of the collection on which the index will be created.                                          |
| indexTerm         | string                       | The field in the collection's documents to be indexed. This field will be added to the terms field.     |
| unique (optional) | boolean                      | Specifies whether the index values should be unique.                                                   |
| serialized (optional) | boolean                   | Specifies whether the index should be serialized.                                                      |
| data (optional)   | object      | Additional data associated with the index.                                                              |
| permissions (optional)| object      | Permissions associated with the collection.                    |

Please note that the params of **CreateCollectionIndex** has been slightly modified for ease of use


## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License
This library is licensed under the [MIT License](https://opensource.org/licenses/MIT).

