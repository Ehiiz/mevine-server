// src/core/logger/winston-nestjs-logger.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable()
export class WinstonNestJSLogger extends Logger {
  // Add a private property to store the context
  private currentContext?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
    // Allow an optional initial context to be set during injection
    initialContext?: string,
  ) {
    super(); // Call the parent Logger constructor
    if (initialContext) {
      this.setContext(initialContext);
    }
  }

  /**
   * Sets the context for this logger instance.
   * This context will be used for all subsequent log calls from this instance
   * unless overridden by a specific log call.
   * @param context The string context to set.
   */
  setContext(context: string) {
    this.currentContext = context;
  }

  // Override NestJS Logger methods to use the stored context
  log(message: any, context?: string) {
    // Use the provided context, or fall back to the instance's context
    this.winstonLogger.info(message, {
      context: context || this.currentContext,
    });
  }

  error(message: any, trace?: any, context?: string) {
    this.winstonLogger.error(message, {
      trace,
      context: context || this.currentContext,
    });
  }

  warn(message: any, context?: string) {
    this.winstonLogger.warn(message, {
      context: context || this.currentContext,
    });
  }

  debug(message: any, context?: string) {
    this.winstonLogger.debug(message, {
      context: context || this.currentContext,
    });
  }

  verbose(message: any, context?: string) {
    this.winstonLogger.verbose(message, {
      context: context || this.currentContext,
    });
  }

  // Additional Winston methods (ensure they also use the context)
  info(message: any, meta?: any) {
    // Merge provided meta with the context
    const finalMeta = {
      ...meta,
      context: meta?.context || this.currentContext,
    };
    this.winstonLogger.info(message, finalMeta);
  }

  // Access to underlying Winston logger
  getWinstonLogger(): WinstonLogger {
    return this.winstonLogger;
  }
}
