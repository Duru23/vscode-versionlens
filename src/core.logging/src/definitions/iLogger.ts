export enum LogLevelTypes {
  Error = "error",
  Info = "info",
  Verbose = "verbose",
  Debug = "debug",
}

export type LoggerOptions = {

  namespace: string;

}

export interface ILogger {

  log(level: LogLevelTypes, message: string, ...splats: any): void;

  info(message: string, ...splats: any): void;

  debug(message: string, ...splats: any): void;

  error(message: string, ...splats: any): void;

  verbose(message: string, ...splats: any): void;

  child(options: LoggerOptions): ILogger;
}
