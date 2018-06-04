import { createLoggers } from "logita";
import { mockStdout, mockStderr } from "test/log.spec";
import chalk from "chalk";

const log = createLoggers({
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
  timestamp: "DD.MM.YYYY HH:mm:ss",
  showFile: false
});

log.important("Alarm!");
log.notSoImportant("Hello world");
log.silly("How do you do");
