/**
Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive).
*/
type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint
  | Error;

/**
Matches a JSON array.
*/
export interface JsonArray extends Array<JsonValue> {}

/**
Matches any valid JSON value.
*/
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | object
  | JsonObject
  | JsonArray;

/**
Matches a JSON object.
This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. Don't use this as a direct return type as the user would have to double-cast it: `jsonObject as unknown as CustomResponse`. Instead, you could extend your CustomResponse type from it to ensure your type only uses JSON-compatible types: `interface CustomResponse extends JsonObject { … }`.
*/
export type JsonObject = { [Key in string]?: JsonValue };

export type ErrorObject = {
  name?: string;
  stack?: string;
  message?: string;
  code?: string;
} & JsonObject;

/**
Serialize an `Error` object into a plain object.
Non-error values are passed through.
Custom properties are preserved.
Circular references are handled.
@example
```
const error = new Error('🦄');
console.log(error);
//=> [Error: 🦄]
console.log(serializeError(error));
//=> {name: 'Error', message: '🦄', stack: 'Error: 🦄\n    at Object.<anonymous> …'}
```
*/
export function serializeError<ErrorType>(
  error: ErrorType,
): ErrorType extends Primitive ? ErrorType : ErrorObject;

/**
Deserialize a plain object or any value into an `Error` object.
`Error` objects are passed through.
Non-error values are wrapped in a `NonError` error.
Custom properties are preserved.
Non-enumerable properties are kept non-enumerable (name, message, stack).
Enumerable properties are kept enumerable (all properties besides the non-enumerable ones).
Circular references are handled.
@example
```
const error = deserializeError({
	message: 'aaa',
	stack: 'at <anonymous>:1:13'
});
console.log(error);
// Error: aaa
// at <anonymous>:1:13
```
*/
export function deserializeError(errorObject: ErrorObject | unknown): Error;
