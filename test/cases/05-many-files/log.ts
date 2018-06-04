import { createLoggers } from "logita";
import { mockStdout, mockStderr } from "test/log.spec";

export default createLoggers({
  stdout: mockStdout.log.bind(mockStdout),
  stderr: mockStderr.log.bind(mockStderr)
});
