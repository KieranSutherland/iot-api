# GraphQL

This package defines the GraphQL schema for the service and the various input and output types.

The types in this package must mirror those in the API package.

## Schema

The schema is defined using code-first objects provided by the `graphql` library. There are two source folders that
define the schema:

* `src/operations` - contains the definition of top-level query/mutation fields.
* `src/types` - contains the definition of each input and output type for entities, enums etc.
