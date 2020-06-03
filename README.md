# deno-serialize-error ![ci](https://github.com/rjoydip/deno-serialize-error/workflows/ci/badge.svg)

> Serialize/deserialize an error into a plain object

Useful if you for example need to `JSON.stringify()` or `process.send()` the error.

## Usage

```ts
import {serializeError, deserializeError} from "https://deno.land/x/deno-serialize-error/mod.ts";

const error = new Error('🦄');

console.log(error);
//=> [Error: 🦄]

const serialized = serializeError(error)

console.log(serialized);
//=> {name: 'Error', message: '🦄', stack: 'Error: 🦄\n    at Object.<anonymous> …'}

const deserialized = deserializeError(serialized);
//=> [Error: 🦄]
```

## API

### serializeError(value)

Type: `Error | unknown`

Serialize an `Error` object into a plain object.

Non-error values are passed through.
Custom properties are preserved.
Non-enumerable properties are kept non-enumerable (name, message, stack).
Enumerable properties are kept enumerable (all properties besides the non-enumerable ones).
Circular references are handled.

### deserializeError(value)

Type: `{[key: string]: unknown} | unknown`

Deserialize a plain object or any value into an `Error` object.

`Error` objects are passed through.
Non-error values are wrapped in a `NonError` error.
Custom properties are preserved.
Circular references are handled.

## Inspired

Inspired by [serialize-error](https://github.com/sindresorhus/serialize-error)
