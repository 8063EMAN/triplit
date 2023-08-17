import { EAV } from './triple-store';
import { TuplePrefix } from './utility-types';

function setToJSON(val: Set<string>) {
  // NOTE: Previously this returned an object from entries, but that loses some information as all keys are converted to strings
  // This caused query issues down the line when queries expecting numbers were searching over strings and failing

  return new Map(Array.from(val).map((item) => [item, true]));
}

// TODO: add tests for Document.insert (notably for insert Set<number> or a non-string Set)
export function objectToTuples(
  object: any,
  prefix: (string | number)[] = []
): [...(string | number)[], number | string | null][] {
  if (object == null || typeof object !== 'object') {
    return [[...prefix, object as string | number | null]];
  }
  // Maybe we support Maps in the future, for now this is secretly a helper for Sets
  if (object instanceof Map) {
    return [...object.entries()].flatMap(([key, val]) =>
      objectToTuples(val, [...prefix, key])
    );
  }
  if (object instanceof Set) {
    const normalizedObj = setToJSON(object);
    return objectToTuples(normalizedObj, prefix);
  }
  if (object instanceof Array) {
    return object.flatMap((val, i) => objectToTuples(val, [...prefix, i]));
  }
  return Object.keys(object).flatMap((key) =>
    objectToTuples(object[key], [...prefix, key])
  );
}

export function triplesToObject<T>(triples: TuplePrefix<EAV>[]) {
  const result: any = {};
  for (const [e, a, v] of triples) {
    if (!result[e]) result[e] = {};
    a.reduce((acc, curr, i) => {
      if (i === a.length - 1) {
        acc[curr] = v;
        return acc;
      }
      if (!acc[curr]) acc[curr] = typeof a[i + 1] === 'number' ? [] : {};
      return acc[curr];
    }, result[e]);
  }
  return result as T;
}
