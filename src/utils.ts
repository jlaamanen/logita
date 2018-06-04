export interface Caller {
  path: string;
  line: string;
  column: string;
}

/**
 * Finds out the callsite of the caller of the caller of this function.
 * In other words, wherever this function is imported and called, this returns the caller of that function.
 */
export function getCaller(): Caller {
  const stackRows = new Error().stack.split("\n");
  // rows[0]: "Error"
  // rows[1]: This function
  // rows[2]: Caller of this function
  // rows[3]: Caller of the caller of this function (which we want to return)
  const stackLine = stackRows[3];
  const [original, path, line, column] = stackLine.match(
    /\(?(\S*):(\d+):(\d+)\)?/
  );
  return {
    path,
    line,
    column
  };
}

/**
 * Injects given configuration object with given default object (for the first level).
 * @param source
 * @param defaults
 */
export function injectWithDefaults<S extends object, D extends object>(
  source: S,
  defaults: D
): S {
  return Object.keys(defaults).reduce(
    (target, key) => ({
      ...(<any>target),
      [key]:
        source && typeof source[key] !== "undefined"
          ? source[key]
          : defaults[key]
    }),
    source
  );
}
