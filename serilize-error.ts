import { JsonObject, ErrorObject } from "./index.d.ts";

class NonError extends Error {
  constructor(message: any) {
    super(NonError._prepareSuperMessage(message));
    Object.defineProperty(this, "name", {
      value: "NonError",
      configurable: true,
      writable: true,
    });
  }

  static _prepareSuperMessage<ErrorType>(message: ErrorType) {
    try {
      return JSON.stringify(message);
    } catch (_) {
      return String(message);
    }
  }
}

const commonProperties = [
  { property: "name", enumerable: false },
  { property: "message", enumerable: false },
  { property: "stack", enumerable: false },
  { property: "code", enumerable: true },
];

function destroyCircular<ErrorType>({
  from,
  seen,
  to_,
  forceEnumerable,
}: {
  from: JsonObject | any; // TODO()
  seen: any[];
  to_?: {
    [key: string]: any;
  } | ErrorType;
  forceEnumerable?: boolean;
}) {
  const to = to_ || (Array.isArray(from) ? [] : {});

  seen.push(from);

  for (const [key, value] of Object.entries(from)) {
    if (typeof value === "function") {
      continue;
    }

    if (!value || typeof value !== "object") {
      to[key] = value;
      continue;
    }

    if (!seen.includes(from[key])) {
      to[key] = destroyCircular({
        from: from[key],
        seen: seen.slice(),
        forceEnumerable,
      });
      continue;
    }

    to[key] = "[Circular]";
  }

  for (const { property, enumerable } of commonProperties) {
    if (typeof from[property] === "string") {
      Object.defineProperty(to, property, {
        value: from[property],
        enumerable: forceEnumerable ? true : enumerable,
        configurable: true,
        writable: true,
      });
    }
  }

  return to;
}

export function serializeError<ErrorType>(
  value: ErrorType,
): string | ErrorType | ErrorObject {
  if (typeof value === "object" && value !== null) {
    return destroyCircular<ErrorType>(
      { from: value, seen: [], forceEnumerable: true },
    );
  }

  // People sometimes throw things besides Error objects…
  if (typeof value === "function") {
    // `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
    return `[Function: ${value["name"] || "anonymous"}]`;
  }

  return value;
}

export function deserializeError<ErrorType>(
  value: ErrorType | ErrorObject | unknown,
): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const newError = new Error();
    destroyCircular({ from: value, seen: [], to_: newError });
    return newError;
  }

  return new NonError(value);
}
