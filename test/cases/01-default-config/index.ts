import { createLoggers } from "logita";
import { mockStdout, mockStderr } from "test/log.spec";

// Closest to default config as we possibly could get, trying to mock console.log/error with custom functions
const log = createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr)
});

log.fatal("This is a fatal log message!!");
log.error("This is an error log message!");
log.warning("This is a warning");
log.info("This is informational");
log.verbose("This is quite verbose");
log.debug("This is for debugging purposes");
