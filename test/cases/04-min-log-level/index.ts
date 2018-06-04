import { createLoggers } from "logita";
import { mockStdout, mockStderr } from "test/log.spec";
import chalk from "chalk";

const defaultLog = createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr),
  minLevel: "warning"
});

defaultLog.debug("Shouldn't be displayed");
defaultLog.verbose("Shouldn't be displayed");
defaultLog.info("Shouldn't be displayed");
defaultLog.warning("Should be displayed");
defaultLog.error("Should be displayed");
defaultLog.fatal("Should be displayed");

const defaultLogSpan = defaultLog.span.debug("Default log span");
defaultLogSpan.splitTime("Shouldn't be displayed");
defaultLogSpan.debug.splitTime("Shouldn't be displayed");
defaultLogSpan.verbose.splitTime("Shouldn't be displayed");
defaultLogSpan.info.splitTime("Shouldn't be displayed");
defaultLogSpan.warning.splitTime("Should be displayed");
defaultLogSpan.error.splitTime("Should be displayed");
defaultLogSpan.fatal.splitTime("Should be displayed");
defaultLogSpan.success("Shouldn't be displayed");

const customLog = createLoggers({
  levels: {
    important: {
      priority: 0,
      color: chalk.bgRed.white,
      text: "UH-OH",
      stderr: true
    },
    notSoImportant: {
      priority: 1,
      color: chalk.yellow,
      text: "meh"
    },
    silly: {
      priority: 2,
      color: chalk.green
    }
  },
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr),
  showFile: false,
  minLevel: "notSoImportant"
});

customLog.silly("Shouldn't be displayed");
customLog.notSoImportant("Should be displayed");
customLog.important("Should be displayed");

const customLogSpan = customLog.span.silly("Custom log span");
customLogSpan.splitTime("Shouldn't be displayed");
customLogSpan.notSoImportant.splitTime("Should be displayed");
customLogSpan.important.splitTime("Should be displayed");
customLogSpan.important.fail("Should be displayed");
