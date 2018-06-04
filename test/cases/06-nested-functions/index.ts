import { createLoggers } from "logita";
import { mockStdout, mockStderr } from "test/log.spec";

const log = createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr)
});

(() => {
  log.verbose("Log message from first level");
  (() => {
    log.info("Log message from second level");
    (() => {
      log.warning("Log message from third level");
      (() => {
        log.error("Log message from fourth level");
      })();
    })();
  })();
})();
