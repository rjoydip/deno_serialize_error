const { test } = Deno;
import { assert, assertEquals, assertNotEquals } from "./deps.ts";
import { serializeError, deserializeError } from "./serilize_error.ts";
import { JsonObject } from "./index.d.ts";

// TODO(): Improve serialized types

function deserializeNonError(value: any) {
  const deserialized = deserializeError(value);
  assert(deserialized instanceof Error);
  assertEquals(deserialized.constructor.name, "NonError");
  assertEquals(deserialized.message, JSON.stringify(value));
}

test("main", () => {
  const serialized = serializeError(new Error("foo"));
  const properties = Object.keys(serialized);

  assertEquals(properties.includes("name"), true);
  assertEquals(properties.includes("stack"), true);
  assertEquals(properties.includes("message"), true);
});

test("should destroy circular references", () => {
  const object: JsonObject = {};
  object.child = { parent: object };
  const serialized = serializeError<JsonObject>(object);

  assertEquals(typeof serialized, "object");
  assertEquals((<any> serialized).child.parent, "[Circular]");
});

test("should not affect the original object", () => {
  const object: JsonObject = {};
  object.child = { parent: object };
  const serialized = serializeError<JsonObject>(object);

  assertNotEquals(serialized, object);
  assertEquals((<any> object).child.parent, object);
});

test("should only destroy parent references", () => {
  const object: JsonObject = {};
  const common = { thing: object };
  object.one = { firstThing: common };
  object.two = { secondThing: common };
  const serialized = serializeError<JsonObject>(object);

  assertEquals(typeof (<any> serialized).one.firstThing, "object");
  assertEquals(typeof (<any> serialized).two.secondThing, "object");
  assertEquals((<any> serialized).one.firstThing.thing, "[Circular]");
  assertEquals((<any> serialized).two.secondThing.thing, "[Circular]");
});

test("should work on arrays", () => {
  const object: JsonObject = {};
  const common = [object];
  const x = [common];
  const y: { [Key: number]: any } = [["test"], common];
  y[0][1] = y;
  object.a = { x };
  object.b = { y };
  const serialized = serializeError<JsonObject>(object);

  assert(Array.isArray((<any> serialized).a.x));
  assertEquals((<any> serialized).a.x[0][0], "[Circular]");
  assertEquals((<any> serialized).b.y[0][0], "test");
  assertEquals((<any> serialized).b.y[1][0], "[Circular]");
  assertEquals((<any> serialized).b.y[0][1], "[Circular]");
});

test("should discard nested functions", () => {
  function a() {}
  function b() {}
  a.b = b;
  const object = { a };
  const serialized = serializeError<JsonObject>(object);

  assertEquals(serialized, {});
});

test("should replace top-level functions with a helpful string", () => {
  function a() {}
  function b() {}
  a.b = b;
  const serialized = serializeError<Function>(a);

  assertEquals(serialized, "[Function: a]");
});

test("should drop functions", () => {
  function a() {}
  a.foo = "bar;";
  a.b = a;
  const object: JsonObject = { a };
  const serialized = serializeError<JsonObject>(object);

  assertEquals(serialized, {});
  assert(!Object.prototype.hasOwnProperty.call(serialized, "a"));
});

test("should not access deep non-enumerable properties", () => {
  const error = new Error("some error");
  const object: JsonObject = {};
  Object.defineProperty(object, "someProp", {
    enumerable: false,
    get() {
      throw new Error("some other error");
    },
  });
  (<any> error).object = object;
  assert(() => serializeError<Error>(error));
});

test("should serialize nested errors", () => {
  const error = new Error("outer error");
  (<any> error).innerError = new Error("inner error");
  const serialized = serializeError<Error>(error);

  assertEquals((<any> serialized).message, "outer error");
  assertEquals((<any> serialized).innerError.message, "inner error");
});

test("should handle top-level null values", () => {
  const serialized = serializeError<null>(null);
  assertEquals(serialized, null);
});

test("should deserialize null", () => {
  deserializeNonError(null);
});

test("should deserialize number", () => {
  deserializeNonError(1);
});

test("should deserialize boolean", () => {
  deserializeNonError(true);
});

test("should deserialize string", () => {
  deserializeNonError("123");
});

test("should deserialize array", () => {
  deserializeNonError([1]);
});

test("should deserialize error", () => {
  const deserialized = deserializeError(new Error("test"));
  assert(deserialized instanceof Error);
  assertEquals(deserialized.message, "test");
});

test("should deserialize and preserve existing properties", () => {
  const deserialized = deserializeError<{
    message: string;
    customProperty: boolean;
  }>({
    message: "foo",
    customProperty: true,
  });
  assert(deserialized instanceof Error);
  assertEquals(deserialized.message, "foo");
  assert((<any> deserialized).customProperty);
});

test("should deserialize plain object", () => {
  const deserialized = deserializeError<
    {
      code: string;
    } & Error
  >({
    message: "error message",
    stack: "at <anonymous>:1:13",
    name: "name",
    code: "code",
  });

  assertEquals(deserialized instanceof Error, true);
  assertEquals(deserialized.message, "error message");
  assertEquals(deserialized.stack, "at <anonymous>:1:13");
  assertEquals(deserialized.name, "name");
  assertEquals((<any> deserialized).code, "code");
});

test("deserialized name, stack and message should not be enumerable, other props should be", () => {
  const object = {
    message: "error message",
    stack: "at <anonymous>:1:13",
    name: "name",
  };
  const nonEnumerableProps = Object.keys(object);

  const enumerables = {
    code: "code",
    path: "./path",
    errno: 1,
    syscall: "syscall",
    randomProperty: "random",
  };
  const enumerableProps = Object.keys(enumerables);

  const deserialized = deserializeError({ ...object, ...enumerables });
  const deserializedEnumerableProps = Object.keys(deserialized);

  for (const prop of nonEnumerableProps) {
    assert(!deserializedEnumerableProps.includes(prop));
  }

  for (const prop of enumerableProps) {
    assert(deserializedEnumerableProps.includes(prop));
  }
});
