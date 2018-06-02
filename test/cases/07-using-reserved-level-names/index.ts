import { createLoggers } from "logita";
import { mockStdout, mockStderr, advanceTime } from "test/log.spec";

const log = createLoggers({
  levels: {
    splitTime: 0,
    success: 1,
    fail: {
      priority: 2,
      stderr: true
    },
    span: 3
  },
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr)
});

// First do some normal logging (note: span does not exist, because it gets shadowed by log span)
log.success("Success log message");
log.fail("Fail");
log.splitTime("What the hell is a 'split time' log level anyway??");

// Then, try out the span functionality
const span = log.span.splitTime("Test span");
span.splitTime("First split time");
advanceTime(1000);
try {
  // span.success should be a function and an error should be thrown here
  // This is tested in case everyone isn't using TypeScript, hence the <any>... :)
  (<any>span.success).splitTime("This should not work");
} catch (error) {
  log.fail(error);
}

const anotherSpan = log.span.span("Getting weird");
advanceTime(12345);
anotherSpan.span.success();
