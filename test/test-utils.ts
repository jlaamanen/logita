import { readFileSync, readdirSync, lstatSync } from "fs";
import { resolve, dirname, join } from "path";

/**
 * Class for mocking stdout & stderr streams in unit tests.
 */
export class MockStream {
  private lines: string[] = [];

  constructor() {
    this.lines = [];
  }

  public log(...messages: any[]) {
    this.lines.push(messages.join(" "));
  }

  public clear() {
    this.lines = [];
  }

  get output() {
    return this.lines.join("\n");
  }
}

/**
 * Parses a file containing unicode escape sequences to a string containing the
 * actual, unescaped unicode characters.
 * @param path
 */
function parseUnicodeFile(path: string) {
  return (
    readFileSync(path)
      .toString()
      // Split each row to be parsed separately (new lines are considered unexpected tokens in JSON)
      .split("\n")
      // Stringify and use JSON.parse for each row to unescape unicode sequences
      .map(row => JSON.parse(`"${row}"`))
      // Rejoin the rows with new line
      .join("\n")
  );
}

/**
 * Reads an expected output file from given relative path.
 * Also converts it to be comparable with output from unit test cases.
 * @param path
 */
export function getExpectedOutput(path: string) {
  const filePath = resolve(__dirname, path);
  return (
    parseUnicodeFile(resolve(__dirname, path))
      .replace(/\{\{filePath\}\}/g, resolve(dirname(filePath), "index.ts"))
      // Case dir can be given with
      .replace(/\{\{caseDir\/?(.*)\}\}/g, (match, subPath) =>
        resolve(dirname(filePath), ...subPath.split("/"))
      )
      .trim()
  );
}

/**
 * Gets all directory names in given path.
 * @param path
 */
export function getDirectories(path: string) {
  const sourcePath = resolve(__dirname, path);
  return readdirSync(sourcePath).filter(file =>
    lstatSync(resolve(sourcePath, file)).isDirectory()
  );
}
