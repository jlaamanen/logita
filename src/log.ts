import chalk, { Chalk, ColorSupport } from "chalk";
import { Caller, getCaller, injectWithDefaults } from "./utils";
import * as moment from "moment";

export interface LogLevel {
  priority: number;
  text?: string;
  color?: Chalk & {
    // Chalk typings add this union for some reason
    supportsColor?: ColorSupport;
  };
  stderr?: boolean;
}

export interface LogLevels {
  [name: string]: LogLevel | number;
}

export interface LogSettings<T extends LogLevels = typeof defaultLevels> {
  /**
   * Log span specific settings
   */
  span?: {
    /**
     * Show the split time difference since previous time?
     *
     * Default: true
     */
    showSplitDifference?: boolean;
  };
  /**
   * Minimum level which log messages should be logged.
   * If not given in config, environment variable LOG_MIN_LEVEL is read.
   * If falsy (null/undefined) or log level doesn't exist, all levels will be logged.
   *
   * Default: LOG_MIN_LEVEL || undefined
   */
  minLevel?: keyof T;
  /**
   * Timestamp setting, can be given as boolean or string:
   * - boolean: should timestamp be shown?
   * - string: timestamp format (moment.js)
   *
   * If format is not given, Date.prototype.toUTCString is used.
   *
   * Default: true
   */
  timestamp?: boolean | string;
  /**
   * Should file information (path:lineNumber:columnNumber) be shown in the prefix?
   *
   * Default: true
   */
  showFile?: boolean;
  /**
   * Function for logging stdout stream
   *
   * Default: console.log
   */
  stdout?: LogFunction;
  /**
   * Function for logging stderr stream
   *
   * Default: console.error
   */
  stderr?: LogFunction;
}

export type LogConfig<T extends LogLevels> = {
  /**
   * Logging level definitions.
   *
   * If not given, default log levels are used:
   * - fatal (0)
   * - error (1)
   * - warning (2)
   * - info (3)
   * - verbose (4)
   * - debug (5)
   */
  levels?: T;
} & LogSettings<T>;

type NormalizedLogConfig<T extends LogLevels> = {
  levels?: T;
} & LogSettings<T>;

export type LogFunction = (...messages: any[]) => void;

export type LoggerObject<T extends LogLevels> = {
  [key in Exclude<keyof T, "span">]: LogFunction
} & {
  span: LogSpanObject<T>;
};

export type LogSpanObject<T extends LogLevels> = {
  [key in keyof T]: (
    name: string
  ) => { [key in Exclude<keyof T, LogSpanFunctionName>]: LogSpanFunctions } &
    LogSpanFunctions
};

export type LogSpanFunctionName = "splitTime" | "success" | "fail";

export type LogSpanFunctions = {
  [key in LogSpanFunctionName]: (message?: string) => void
};

export const defaultLevels = {
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
};

const defaultConfig: LogConfig<typeof defaultLevels> = {
  levels: defaultLevels,
  span: {
    showSplitDifference: true
  },
  minLevel: <keyof typeof defaultLevels>process.env.LOG_MIN_LEVEL || undefined,
  timestamp: true,
  showFile: true,
  stdout: console.log,
  stderr: console.error
};

function normalizeConfig<T extends LogLevels>(
  config: LogConfig<T>
): NormalizedLogConfig<T> {
  const defaultInjectedConfig = {
    ...injectWithDefaults(config, defaultConfig),
    span: injectWithDefaults((config || {}).span, defaultConfig.span)
  };
  const normalizedLevels = Object.keys(defaultInjectedConfig.levels).reduce(
    (levels, levelName) => {
      const levelValue = defaultInjectedConfig.levels[levelName];
      return Object.assign(levels, {
        [levelName]:
          typeof levelValue === "number"
            ? {
                priority: levelValue
              }
            : levelValue
      });
    },
    defaultInjectedConfig.levels
  );
  return {
    ...defaultInjectedConfig,
    levels: normalizedLevels
  };
}

function messageShouldBeLogged<T extends LogLevels>(
  levelName: keyof T,
  config: NormalizedLogConfig<T>
) {
  // TODO: level is always of type LogLevel after normalization, fix typings to remove these casts
  const level = <LogLevel>config.levels[levelName];
  const minLevel = <LogLevel>(
    ((config.minLevel && config.levels[config.minLevel]) || null)
  );
  return !minLevel || minLevel.priority >= level.priority;
}

function getPrefix<T extends LogLevels>(
  levelName: keyof T,
  config: NormalizedLogConfig<T>,
  caller: Caller
) {
  // TODO: level is of type LogLevel after normalization, fix typings to remove this casting
  const level = <LogLevel>config.levels[levelName];
  const levelColor = level.color || chalk.bgBlack.white;
  const levelText = level.text || (<string>levelName).toUpperCase();
  const log = level.stderr ? config.stderr : config.stdout;
  // Use default UTC string as default, otherwise format timestamp with moment.js
  const formattedTimestamp =
    config.timestamp === true
      ? new Date(Date.now()).toUTCString()
      : typeof config.timestamp === "string"
        ? moment().format(config.timestamp)
        : "";
  return [
    formattedTimestamp.length > 0 ? `[${formattedTimestamp}]` : "",
    caller ? `${caller.path}:${caller.line}:${caller.column}` : "",
    chalk.bold.white(`[${levelColor(levelText)}]`)
  ]
    .filter(part => part.length > 0)
    .join(" ");
}

function millisecondsToSeconds(milliseconds: number, precision = 2) {
  return Number(milliseconds / 1000).toFixed(precision);
}

function formatSpanDuration(
  times: { start: number; previous: number },
  showTimeDifference: boolean
) {
  const now = Date.now();
  const totalDuration = millisecondsToSeconds(now - times.start);
  const splitDuration = millisecondsToSeconds(now - times.previous);
  times.previous = now;
  return `${totalDuration} s${
    showTimeDifference ? ` (+ ${splitDuration} s)` : ""
  }`;
}

/**
 * Creates a logging function for given level name and config.
 * @param levelName
 * @param config
 */
function createLogFunction<T extends LogLevels>(
  levelName: keyof T,
  config: NormalizedLogConfig<T>
) {
  return (...messages: any[]) => {
    if (!messageShouldBeLogged(levelName, config)) {
      // Logged message has lower priority (order number is higher) => skip logging
      return;
    }
    // TODO: level is of type LogLevel after normalization, fix typings to remove this casting
    const level = <LogLevel>config.levels[levelName];
    const prefix = getPrefix(
      levelName,
      config,
      config.showFile ? getCaller() : null
    );
    const log = level.stderr ? config.stderr : config.stdout;
    log(prefix, ...messages);
  };
}

function createLogSpanFunction<T extends LogLevels>(
  levelName: keyof T,
  config: NormalizedLogConfig<T>,
  name: string,
  type: LogSpanFunctionName | "start",
  times: { start: number; previous: number },
  spanCaller?: Caller
) {
  return (message?: string) => {
    if (!messageShouldBeLogged(levelName, config)) {
      // Logged message has lower priority (order number is higher) => skip logging
      return;
    }
    // TODO: level is of type LogLevel after normalization, fix typings to remove this casting
    const level = <LogLevel>config.levels[levelName];
    const prefix = getPrefix(
      levelName,
      config,
      config.showFile ? spanCaller || getCaller() : null
    );
    const log = level.stderr ? config.stderr : config.stdout;
    const formattedMessage = (<{ [key in typeof type]: string }>{
      start: "Started",
      splitTime: message || "Split time",
      success: message || "Successful in",
      fail: message || "Failed in"
    })[type];
    const segments = [
      prefix,
      chalk.bold.white(`${name} |`),
      formattedMessage,
      type !== "start"
        ? formatSpanDuration(times, config.span.showSplitDifference)
        : ""
    ]
      .filter(segment => segment.length > 0)
      .join(" ");
    log(segments);
  };
}

function createLogSpanObject<T extends LogLevels>(
  loggers: LoggerObject<T>,
  config: NormalizedLogConfig<T>
) {
  // Iterate through all created log levels
  return Object.keys(loggers).reduce<LogSpanObject<T>>(
    (spanLoggers, defaultLevelName: keyof T) =>
      Object.assign(spanLoggers, {
        [defaultLevelName]: (name: string) => {
          const now = Date.now();
          const times = {
            start: now,
            previous: now
          };
          createLogSpanFunction(
            defaultLevelName,
            config,
            name,
            "start",
            times,
            config.showFile ? getCaller() : null
          )();
          const spanLogObject = Object.keys(loggers).reduce<
            { [key in keyof T]: LogSpanFunctions }
          >(
            (spanLoggers, levelName) =>
              Object.assign(spanLoggers, {
                [levelName]: {
                  splitTime: createLogSpanFunction(
                    levelName,
                    config,
                    name,
                    "splitTime",
                    times
                  ),
                  success: createLogSpanFunction(
                    levelName,
                    config,
                    name,
                    "success",
                    times
                  ),
                  fail: createLogSpanFunction(
                    levelName,
                    config,
                    name,
                    "fail",
                    times
                  )
                }
              }),
            <any>{}
          );

          return Object.assign(spanLogObject, {
            // Assign default
            splitTime: spanLogObject[defaultLevelName].splitTime,
            success: spanLogObject[defaultLevelName].success,
            fail: spanLogObject[defaultLevelName].fail
          });
        }
      }),
    <any>{}
  );
}

/**
 * Creates logging functions for given configuration.
 * Returns an object with a logging function for each given logging level.
 * If no configuration is given, uses default logging levels and configuration.
 * @param config
 */
export function createLoggers<T extends LogLevels = typeof defaultLevels>(
  config?: LogConfig<T>
) {
  const normalizedConfig = normalizeConfig(config);
  const loggers = Object.keys(normalizedConfig.levels).reduce<LoggerObject<T>>(
    (loggers, levelName) =>
      Object.assign(loggers, {
        [levelName]: createLogFunction(levelName, normalizedConfig)
      }),
    // <any> cast required, otherwise {} wouldn't be accepted as logger object
    // (all keys will be present for the returned value anyway)
    <any>{}
  );
  loggers.span = createLogSpanObject(loggers, normalizedConfig);
  return loggers;
}

/**
 * Default loggers with levels:
 * - fatal (0)
 * - error (1)
 * - warning (2)
 * - info (3)
 * - verbose (4)
 * - debug (5)
 */
export const defaultLoggers = createLoggers();
