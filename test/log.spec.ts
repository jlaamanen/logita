import { expect } from "chai";
import "mocha";
import { readFileSync } from "fs";
import { resolve } from "path";
import { MockStream, getExpectedOutput, getDirectories } from "./test-utils";
import * as moment from "moment-timezone";

export const mockStdout = new MockStream();
export const mockStderr = new MockStream();

// Use UTC timezone in unit tests to avoid different results
moment.tz.setDefault("UTC");

describe("logita", () => {
  // Use date: Wed, 23 May 2018 20:42:56 GMT
  const mockDate = 1527108176483;

  let originalDateNow = Date.now;

  function generateTestCase(path: string) {
    require(path);
    expect(mockStdout.output).to.equal(
      getExpectedOutput(`${path}/expected-stdout.txt`)
    );
    expect(mockStderr.output).to.equal(
      getExpectedOutput(`${path}/expected-stderr.txt`)
    );
  }

  beforeEach(() => {
    originalDateNow = Date.now;
    Date.now = () => mockDate;
    mockStdout.clear();
    mockStderr.clear();
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  getDirectories("./cases").forEach(testCase => {
    it(`should work with test case ${testCase}`, () => {
      require(`./cases/${testCase}`);
      expect(mockStdout.output).to.equal(
        getExpectedOutput(`./cases/${testCase}/expected-stdout.txt`)
      );
      expect(mockStderr.output).to.equal(
        getExpectedOutput(`./cases/${testCase}/expected-stderr.txt`)
      );
    });
  });
});
