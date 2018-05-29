import chalk, { Chalk, ColorSupport } from "chalk";
import { getCaller, injectWithDefaults } from "./utils";
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
  showFile: true,
  timestamp: true,
  minLevel: <keyof typeof defaultLevels>process.env.LOG_MIN_LEVEL || undefined,
  stdout: console.log,
  stderr: console.error
};

function normalizeConfig<T extends LogLevels>(
  config: LogConfig<T>
): NormalizedLogConfig<T> {
  const defaultInjectedConfig = injectWithDefaults(config, defaultConfig);
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

/**
 * Creates a logging function for given level name and config.
 * @param levelName
 * @param config
 */
function createLogFunction<T extends LogLevels>(
  levelName: string,
  config: NormalizedLogConfig<T>
) {
  return (...messages: any[]) => {
    if (!messageShouldBeLogged(levelName, config)) {
      // Logged message has lower priority (order number is higher) => skip logging
      return;
    }
    // TODO: level is of type LogLevel after normalization, fix typings to remove this casting
    const level = <LogLevel>config.levels[levelName];
    const levelColor = level.color || chalk.bgBlack.white;
    const levelText = level.text || levelName.toUpperCase();
    const log = level.stderr ? config.stderr : config.stdout;
    // Use default UTC string as default, otherwise format timestamp with moment.js
    const formattedTimestamp =
      config.timestamp === true
        ? new Date(Date.now()).toUTCString()
        : typeof config.timestamp === "string"
          ? moment().format(config.timestamp)
          : "";
    const caller = config.showFile ? getCaller() : null;
    const prefix = [
      formattedTimestamp.length > 0 ? `[${formattedTimestamp}]` : "",
      caller ? `${caller.path}:${caller.line}:${caller.column}` : "",
      chalk.bold.white(`[${levelColor(levelText)}]`)
    ]
      .filter(part => part.length > 0)
      .join(" ");
    log(prefix, ...messages);
  };
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
  return Object.keys(normalizedConfig.levels).reduce<
    { [key in keyof T]: LogFunction }
  >(
    (loggers, levelName) =>
      Object.assign(loggers, {
        [levelName]: createLogFunction(levelName, normalizedConfig)
      }),
    // <any> cast required, otherwise {} wouldn't be accepted as logger object
    // (all keys will be present for the returned value anyway)
    <any>{}
  );
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
