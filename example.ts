import { serializeError, deserializeError } from "./mod.ts";

const error = new Error("🦄");

console.log(error);
//=> [Error: 🦄]

const serialized = serializeError(error);

console.log(serialized);
//=> {name: 'Error', message: '🦄', stack: 'Error: 🦄\n    at Object.<anonymous> …'}

const deserialized = deserializeError(serialized);
//=> [Error: 🦄]
