import { createLoggers } from "logita";
import { mockStdout, mockStderr, advanceTime } from "test/log.spec";

const log = createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr)
});

const span1 = log.span.debug("First span");
advanceTime(250);
const span2 = log.span.verbose("Second span");
advanceTime(500);
span1.splitTime();
span2.debug.splitTime();
advanceTime(1000);
span1.verbose.splitTime("Second split time");
advanceTime(1500);
span2.info.success();
advanceTime(500);
span1.fatal.fail();

// Test split difference setting
const log2 = createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr),
  span: {
    showSplitDifference: false
  }
});

const span3 = log2.span.info("Span without split time differences");
advanceTime(1234);
span3.splitTime("First split");
advanceTime(4321);
span3.error.fail();
