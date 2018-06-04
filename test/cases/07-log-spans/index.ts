import { createLoggers } from "logita";
import { mockStdout, mockStderr, advanceTime } from "test/log.spec";

const log = createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr)
});

const span = log.span.debug("Test span");
advanceTime(500);
span.splitTime();
advanceTime(1000);
span.verbose.splitTime("Second split time");
advanceTime(1500);
span.info.success();
