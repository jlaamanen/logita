# logita

🚧 **Work in progress (pre-release)** 🚧

----

Simplistic logging for node.js with extensive TypeScript support.

[![Published on npm](https://img.shields.io/npm/v/logita.svg)](https://www.npmjs.com/package/logita) [![Build Status](https://travis-ci.com/jlaamanen/logita.svg?branch=master)](https://travis-ci.com/jlaamanen/logita)
```shell
npm i logita
```

## Why?

There are several logging libraries, but none of them seem to suite these needs:

* **Logging should always be simple.** Just log a your messages with given severity level.
* **Logs should always be easily tracked.** When debugging, it is important to be able to see *where* the message gets logged, without having to pass extra parameters.
* **Configuration should always be simple.** Nothing frustrates more than trying to find out the perfect configuration for your own needs, when all you want is just pretty logging to console. Too often you need to implement an unnecessarily complicated wrapper to achieve this.

## Features
* Customizable logging levels
* Extensive TypeScript support
* Can be used as easily and as flexibly as `console.log` or `console.error`
* Display file path with line & column numbers (where the log function was called from)
* Quickly navigate to log location on IDEs like

## Getting started

1. To use default logging settings, just import `log`.
2. To create logging object with custom settings, call `createLoggers`. Export the created logging object for your project needs.
3. Start logging!

### Simplest example
```typescript
// /app/src/some-file.ts
import { log } from "logita";

log.debug("Wow, this is cool!");
```

![[Tue, 22 May 2018 20:32:41 GMT] /app/src/some-file.ts:3:5 [DEBUG] Wow, this is cool!](images/example-config-1.png?raw=true)

### Example with some settings overridden
```typescript
// /app/src/log.ts
import { createLoggers } from "logita";

export default createLoggers({
  showFile: false,
  // Use Moment.js format to format the timestamp!
  timestamp: "DD.MM.YYYY HH:mm:ss"
});

// /app/src/another-file.ts
import log from "./log";

log.debug("Wow, this is cool!");
```

![[22.05.2018 23:33:15] [DEBUG] Wow, this is cool!](images/example-config-2.png?raw=true)

### Example with custom logging levels
```typescript
import { createLoggers } from "logita";
// Use chalk to define log level colors!
import chalk from "chalk";

export default createLoggers({
  levels: {
    important: {
      priority: 0,
      color: chalk.bgRed.white,
      text: "UH-OH"
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
  showFile: true,
  timestamp: "YYYY-MM-DD HH:mm:ss"
});

// /app/src/another-file.ts
import log from "./log";

log.important("Alarm!");
log.notSoImportant("Hello world");
log.silly("How do you do");
```

![[2018-05-22 23:33:32] /app/src/another-file.ts:3:5 [UH-OH] Alarm!
[2018-05-22 23:33:32] /app/src/another-file.ts:4:5 [meh] Hello world
[2018-05-22 23:33:32] /app/src/another-file.ts:5:5 [SILLY] How do you do](images/example-config-3.png?raw=true)

## API

### createLoggers(config)

Returns an object containing a simple logging function for each given logging level.

* **config.levels** (optional)
  * Default levels:
    * `fatal` (0)
    * `error` (1)
    * `warning` (2)
    * `info` (3)
    * `verbose` (4)
    * `debug` (5)
  * **config.levels[*level*].priority** (required)
    * Number
    * Defines the priority for logging level: the lower, more important the level is
  * **config.levels[*level*].text** (optional)
    * String
    * Log level text, shown in the prefix of the log message
    * Default: log level key in upper case
  * **config.levels[*level*].color** (optional)
    * Log level text color as a [Chalk](https://github.com/chalk/chalk) function
    * Default: `chalk.bgBlack.bold.white`
  * **config.levels[*level*].stderr** (optional)
    * Boolean
    * Should the log be directed to `stderr` instead of `stdout`?
    * Default: `false`
* **config.minLevel** (optional)
  * String (key of some log level)
  * Minimum log level that should be logged
  * Default: tries to find it from `process.env.MIN_LOG_LEVEL`, but if none is found, everything gets logged
* **config.timestamp** (optional)
  * Boolean or string
  * If `false`, timestamp is not shown
  * If `true`, timestamp is shown with `Date.prototype.toUTCString`
  * If string, timestamp is formatted with it using [Moment.js](https://github.com/moment/moment/)
  * Default: `true`, i.e. show timestamp with `Date.prototype.toUTCString`
* **config.showFile** (optional)
  * Boolean
  * Should the file path be shown in the log message prefix?
  * Default: `true`
* **config.stdout** (optional)
  * Function for logging `stdout` output
  * Default: `console.log`
* **config.stderr** (optional)
  * Function for logging `stderr` output
  * Default: `console.error`

Default config:

```typescript
{
  {
    levels: {
      fatal: {
        priority: 0,
        color: chalk.bgRedBright.white,
        stderr: true
      },
      error: {
        priority: 1,
        color: chalk.bgBlack.red,
        stderr: true
      },
      warning: {
        priority: 2,
        color: chalk.bgBlack.yellow
      },
      info: {
        priority: 3,
        color: chalk.bgBlack.blue
      },
      verbose: {
        priority: 4,
        color: chalk.bgBlack.green
      },
      debug: {
        priority: 5,
        color: chalk.inverse.bgWhite.gray
      }
    }
  },
  showFile: true,
  timestamp: true,
  minLevel: process.env.LOG_MIN_LEVEL || undefined,
  stdout: console.log,
  stderr: console.error
}
```

Example log messages with default config:

![[Tue, 22 May 2018 20:35:24 GMT] /app/src/some-file.ts:3:5 [FATAL] This is a fatal log message!!
[Tue, 22 May 2018 20:35:24 GMT] /app/src/some-file.ts:4:5 [ERROR] This is an error log message!
[Tue, 22 May 2018 20:35:24 GMT] /app/src/some-file.ts:5:5 [WARNING] This is a warning
[Tue, 22 May 2018 20:35:24 GMT] /app/src/some-file.ts:6:5 [INFO] This is informational
[Tue, 22 May 2018 20:35:24 GMT] /app/src/some-file.ts:7:5 [VERBOSE] This is quite verbose
[Tue, 22 May 2018 20:35:24 GMT] /app/src/some-file.ts:8:5 [DEBUG] This is for debugging purposes](images/default-config.png?raw=true)
